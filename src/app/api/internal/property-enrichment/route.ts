import { NextRequest, NextResponse } from "next/server";
import { hasValidBearerToken } from "@/lib/internal-api-auth";
import { createPropertyDataProviders, assertValidProvider } from "@/lib/property-intelligence/provider-registry";
import { PropertyIntelligenceService } from "@/lib/property-intelligence/service";
import { SupabasePropertyIntelligenceStore } from "@/lib/property-intelligence/supabase-store";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.PROPERTY_ENRICHMENT_SECRET;
  if (!secret) return NextResponse.json({ error: "Property enrichment is not configured." }, { status: 503 });
  if (!hasValidBearerToken(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "Property storage is not configured." }, { status: 503 });
  const { data, error } = await db.rpc("claim_property_enrichment_job");
  if (error) return NextResponse.json({ error: "Could not claim an enrichment job." }, { status: 500 });
  const job = Array.isArray(data) ? data[0] : null;
  if (!job) return NextResponse.json({ processed: false, reason: "queue_empty" });

  try {
    const providers = createPropertyDataProviders().map(assertValidProvider);
    const service = new PropertyIntelligenceService(providers, new SupabasePropertyIntelligenceStore(db));
    const result = await service.enrich(String(job.property_id), {
      addressLine1: String(job.address_line_1),
      addressLine2: job.address_line_2 ? String(job.address_line_2) : undefined,
      city: job.city ? String(job.city) : undefined,
      stateCode: job.state_code ? String(job.state_code) : undefined,
      postalCode: job.postal_code ? String(job.postal_code) : undefined,
      countryCode: "US",
    });
    return NextResponse.json({ processed: true, jobId: job.job_id, ...result });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.slice(0, 2000) : "Unknown enrichment failure";
    await db.from("property_enrichment_jobs").update({ status: "failed", last_error: message, locked_at: null, next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", job.job_id);
    return NextResponse.json({ error: "Property enrichment failed." }, { status: 500 });
  }
}
