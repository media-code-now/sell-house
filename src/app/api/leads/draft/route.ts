import { NextRequest, NextResponse } from "next/server";
import { validateDraftStep, type QuestionnaireAnswers } from "@/lib/questionnaire";
import { createServiceClient } from "@/lib/supabase/server";
import { sameOrigin, withinRateLimit } from "@/lib/public-api-security";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Lead storage is not configured." }, { status: 503 });
  if (!(await withinRateLimit(request, supabase, "lead-draft", 60, 600))) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  let body: { draftToken?: string; step?: number; answers?: Partial<QuestionnaireAnswers>;analytics?:{sessionId?:string;visitorId?:string} };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const { draftToken, step, answers } = body;
  if (!draftToken || !/^[0-9a-f-]{36}$/i.test(draftToken) || !Number.isInteger(step) || !step || step < 1 || step > 6 || !answers) {
    return NextResponse.json({ error: "Invalid draft data." }, { status: 400 });
  }
  const validationError = validateDraftStep(step, answers);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 422 });

  const safeAnswers = {
    address: String(answers.address ?? "").slice(0, 240),
    propertyType: String(answers.propertyType ?? "").slice(0, 50),
    condition: String(answers.condition ?? "").slice(0, 50),
    reasons: Array.isArray(answers.reasons) ? answers.reasons.slice(0, 12) : [],
    timeline: String(answers.timeline ?? "").slice(0, 50),
    estimatedValue: String(answers.estimatedValue ?? "").replace(/[$,\s]/g, "").slice(0, 12),
  };
  const { error } = await supabase.from("lead_drafts").upsert({
    draft_token: draftToken,
    answers: safeAnswers,
    last_completed_step: step,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...(/^[0-9a-f-]{36}$/i.test(String(body.analytics?.sessionId??""))?{analytics_session_id:body.analytics?.sessionId}:{}),
    ...(/^[0-9a-f-]{36}$/i.test(String(body.analytics?.visitorId??""))?{analytics_visitor_id:body.analytics?.visitorId}:{}),
  }, { onConflict: "draft_token" });
  if (error) return NextResponse.json({ error: "We couldn’t save your progress. Please try again." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
