import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateLeadScore } from "./engine";
import type { LeadScoringFacts, ScoreBand, ScoringRule } from "./types";

type Job = { jobId: string; leadId: string; claimedAt: string };

export class SupabaseLeadScoringService {
  constructor(private readonly db: SupabaseClient) {}

  async score(job: Job) {
    const model = await this.loadModel();
    const facts = await this.loadFacts(job.leadId);
    const result = calculateLeadScore(facts, model.rules, model.bands);
    const { data, error } = await this.db.rpc("persist_lead_score", {
      p_job_id: job.jobId,
      p_claimed_at: job.claimedAt,
      p_lead_id: job.leadId,
      p_model_id: model.id,
      p_raw_score: result.rawScore,
      p_score: result.score,
      p_classification: result.classification,
      p_input_snapshot: facts,
      p_contributions: result.contributions,
    });
    if (error) throw new Error(error.message);
    return { scoreId: String(data), ...result, model: { id: model.id, name: model.name, version: model.version } };
  }

  private async loadModel() {
    const { data: model, error: modelError } = await this.db.from("lead_scoring_models").select("id,name,version").eq("active", true).single();
    if (modelError || !model) throw new Error(modelError?.message ?? "No active lead scoring model");
    const [{ data: ruleRows, error: ruleError }, { data: bandRows, error: bandError }] = await Promise.all([
      this.db.from("lead_scoring_rules").select("id,rule_key,fact_key,operator,comparison_value,weight,reason,priority").eq("model_id", model.id).eq("active", true).order("priority"),
      this.db.from("lead_score_bands").select("classification,minimum_score,maximum_score").eq("model_id", model.id).order("display_order"),
    ]);
    if (ruleError) throw new Error(ruleError.message);
    if (bandError) throw new Error(bandError.message);
    const rules: ScoringRule[] = (ruleRows ?? []).map((row) => ({ id: String(row.id), ruleKey: String(row.rule_key), factKey: String(row.fact_key), operator: row.operator as ScoringRule["operator"], comparisonValue: row.comparison_value, weight: Number(row.weight), reason: String(row.reason), priority: Number(row.priority) }));
    const bands: ScoreBand[] = (bandRows ?? []).map((row) => ({ classification: String(row.classification), minimumScore: Number(row.minimum_score), maximumScore: Number(row.maximum_score) }));
    return { id: String(model.id), name: String(model.name), version: Number(model.version), rules, bands };
  }

  private async loadFacts(leadId: string): Promise<LeadScoringFacts> {
    const [{ data: propertyRows, error: propertyError }, { data: situationRows, error: situationError }] = await Promise.all([
      this.db.from("properties").select("id,property_condition,occupancy,desired_timeline,estimated_value").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(1),
      this.db.from("lead_situations").select("situation_code").eq("lead_id", leadId),
    ]);
    if (propertyError) throw new Error(propertyError.message);
    if (situationError) throw new Error(situationError.message);
    const property = propertyRows?.[0];
    if (!property) throw new Error("Lead has no property to score");
    const situations = (situationRows ?? []).map((row) => String(row.situation_code));

    const [{ data: valuationRows, error: valuationError }, { data: foreclosureRows, error: foreclosureError }] = await Promise.all([
      this.db.from("property_valuations").select("valuation_type,amount,observed_at").eq("property_id", property.id).in("valuation_type", ["property_value", "equity"]).order("observed_at", { ascending: false }),
      this.db.from("property_foreclosure_records").select("has_indicator,observed_at").eq("property_id", property.id).order("observed_at", { ascending: false }).limit(1),
    ]);
    if (valuationError) throw new Error(valuationError.message);
    if (foreclosureError) throw new Error(foreclosureError.message);
    const latestValue = valuationRows?.find((row) => row.valuation_type === "property_value");
    const latestEquity = valuationRows?.find((row) => row.valuation_type === "equity");
    const estimatedPropertyValue = latestValue ? Number(latestValue.amount) : null;
    const estimatedEquity = latestEquity ? Number(latestEquity.amount) : null;
    const estimatedEquityRatio = estimatedPropertyValue && estimatedEquity !== null ? estimatedEquity / estimatedPropertyValue : null;
    const foreclosureIndicator = foreclosureRows?.[0]?.has_indicator === true;

    return {
      timeline: property.desired_timeline ?? null,
      sellingUrgency: property.desired_timeline ?? null,
      propertyCondition: property.property_condition ?? null,
      occupancy: property.occupancy ?? "unknown",
      situations,
      sellerMotivation: situations,
      vacancySignal: property.occupancy === "vacant" || situations.includes("Vacant property"),
      landlordSignal: situations.includes("Tired landlord") || situations.includes("Problem tenants"),
      foreclosureSignal: foreclosureIndicator || situations.includes("Facing foreclosure"),
      mortgageDelinquencySignal: situations.includes("Behind on mortgage"),
      foreclosureIndicator,
      homeownerEstimatedValue: property.estimated_value === null ? null : Number(property.estimated_value),
      estimatedPropertyValue,
      estimatedEquity,
      estimatedEquityRatio,
    };
  }
}
