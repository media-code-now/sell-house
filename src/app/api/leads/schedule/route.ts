import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sameOrigin, withinRateLimit } from "@/lib/public-api-security";

const windows = ["Morning", "Afternoon", "Evening"];

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Scheduling is not configured." }, { status: 503 });
  if (!(await withinRateLimit(request, supabase, "call-schedule", 10, 3600))) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }
  let body: { draftToken?: string; preferredDate?: string; preferredWindow?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.draftToken || !/^[0-9a-f-]{36}$/i.test(body.draftToken)) return NextResponse.json({ error: "Your submission session has expired." }, { status: 400 });
  if (!body.preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate) || !body.preferredWindow || !windows.includes(body.preferredWindow)) return NextResponse.json({ error: "Choose a preferred day and time." }, { status: 422 });
  const selected = new Date(`${body.preferredDate}T12:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const latest = new Date(today); latest.setDate(latest.getDate() + 60);
  if (selected < today || selected > latest) return NextResponse.json({ error: "Choose a date within the next 60 days." }, { status: 422 });
  const { data: draft, error: draftError } = await supabase.from("lead_drafts").select("completed_lead_id").eq("draft_token", body.draftToken).maybeSingle();
  if (draftError) {
    console.error("[lead-schedule] draft lookup failed", { code: draftError.code, message: draftError.message });
    return NextResponse.json({ error: "We couldn’t load your request. Please try scheduling again." }, { status: 500 });
  }
  if (!draft?.completed_lead_id) return NextResponse.json({ error: "Your submission wasn’t saved or is no longer available. Please return to the property form and submit your request again." }, { status: 404 });
  const { error } = await supabase.from("lead_timeline_events").insert({ lead_id: draft.completed_lead_id, event_type: "call_requested", metadata: { preferred_date: body.preferredDate, preferred_window: body.preferredWindow } });
  if (error) return NextResponse.json({ error: "We couldn’t schedule the call. Please try again." }, { status: 500 });
  return NextResponse.json({ scheduled: true });
}
