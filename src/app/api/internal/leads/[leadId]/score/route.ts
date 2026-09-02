import { NextRequest, NextResponse } from "next/server";
import { hasValidBearerToken } from "@/lib/internal-api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const secret = process.env.LEAD_SCORING_SECRET;
  if (!secret) return NextResponse.json({ error: "Lead scoring is not configured." }, { status: 503 });
  if (!hasValidBearerToken(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { leadId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return NextResponse.json({ error: "Invalid lead ID." }, { status: 400 });
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "Lead storage is not configured." }, { status: 503 });

  const { data: lead, error: leadError } = await db.from("leads").select("current_score_id").eq("id", leadId).single();
  if (leadError) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.current_score_id) return NextResponse.json({ status: "pending", score: null });
  const [{ data: score, error: scoreError }, { data: reasons, error: reasonsError }] = await Promise.all([
    db.from("lead_scores").select("score,classification,calculated_at,model_id").eq("id", lead.current_score_id).single(),
    db.from("lead_score_contributions").select("points,reason").eq("lead_score_id", lead.current_score_id).order("created_at"),
  ]);
  if (scoreError || !score || reasonsError) return NextResponse.json({ error: "Could not load the lead score." }, { status: 500 });
  const { data: model, error: modelError } = await db.from("lead_scoring_models").select("name,version").eq("id", score.model_id).single();
  if (modelError || !model) return NextResponse.json({ error: "Could not load the scoring model." }, { status: 500 });
  return NextResponse.json({ status: "scored", score: Number(score.score), classification: score.classification, calculatedAt: score.calculated_at, modelName: model.name, modelVersion: Number(model.version), reasons: (reasons ?? []).map((reason) => ({ points: Number(reason.points), reason: reason.reason })) });
}
