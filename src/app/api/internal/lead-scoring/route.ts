import { NextRequest, NextResponse } from "next/server";
import { hasValidBearerToken } from "@/lib/internal-api-auth";
import { SupabaseLeadScoringService } from "@/lib/lead-scoring/supabase-service";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.LEAD_SCORING_SECRET;
  if (!secret) return NextResponse.json({ error: "Lead scoring is not configured." }, { status: 503 });
  if (!hasValidBearerToken(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "Lead storage is not configured." }, { status: 503 });

  const { data, error } = await db.rpc("claim_lead_scoring_job");
  if (error) return NextResponse.json({ error: "Could not claim a scoring job." }, { status: 500 });
  const job = Array.isArray(data) ? data[0] : null;
  if (!job) return NextResponse.json({ processed: false, reason: "queue_empty" });

  try {
    const result = await new SupabaseLeadScoringService(db).score({ jobId: String(job.job_id), leadId: String(job.lead_id), claimedAt: String(job.claimed_at) });
    return NextResponse.json({ processed: true, jobId: job.job_id, ...result });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.slice(0, 2000) : "Unknown scoring failure";
    await db.from("lead_scoring_jobs").update({ status: "failed", last_error: message, locked_at: null, next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", job.job_id);
    return NextResponse.json({ error: "Lead scoring failed." }, { status: 500 });
  }
}
