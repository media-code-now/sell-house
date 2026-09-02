import type { SupabaseClient } from "@supabase/supabase-js";
import { getCriteriaSettings } from "./criteria-data";
import type { AcquisitionCriterion, InvestmentInputs, InvestmentResults } from "./investment-calculator";

export const pipelineViews = ["new", "hot", "follow-ups", "offers", "under-contract", "closed", "lost"] as const;
export type PipelineView = typeof pipelineViews[number];
export type LeadStatus = "new" | "attempting_contact" | "qualified" | "offer_prepared" | "offer_sent" | "negotiating" | "nurture" | "under_contract" | "closed" | "lost";

export type AcquisitionLeadCard = {
  id: string;
  sellerName: string;
  address: string;
  market: string | null;
  propertyValueEstimate: number | null;
  propertyValueSource: "provider" | "homeowner" | null;
  estimatedEquity: number | null;
  motivations: string[];
  timeline: string | null;
  score: number | null;
  classification: string | null;
  receivedAt: string;
  assignedManager: string | null;
  status: LeadStatus;
};

export type DashboardTask = { id:string;leadId:string;title:string;details:string|null;dueAt:string|null;assignedTo:string|null;sellerName:string;address:string;overdue:boolean };
export type DashboardActivity = { id:string;leadId:string;type:string;status:string;summary:string;occurredAt:string;sellerName:string };
export type AcquisitionDashboardOverview = { openTasks:DashboardTask[];recentActivities:DashboardActivity[];pendingOffers:number };

type PropertyRow = { id: string; lead_id: string; market_id: string | null; address_line_1: string; address_line_2: string | null; city: string | null; state_code: string | null; postal_code: string | null; estimated_value: number | string | null; desired_timeline: string | null; created_at: string };

export async function getAcquisitionLeads(db: SupabaseClient): Promise<AcquisitionLeadCard[]> {
  const { data: leads, error: leadError } = await db.from("leads").select("id,first_name,last_name,status,created_at,assigned_to,current_score_id").order("created_at", { ascending: false }).limit(500);
  if (leadError) throw new Error(leadError.message);
  const leadIds = (leads ?? []).map((lead) => String(lead.id));
  if (!leadIds.length) return [];
  const [{ data: properties, error: propertyError }, { data: situations, error: situationError }, { data: team, error: teamError }, { data: markets, error: marketError }] = await Promise.all([
    db.from("properties").select("id,lead_id,market_id,address_line_1,address_line_2,city,state_code,postal_code,estimated_value,desired_timeline,created_at").in("lead_id", leadIds).order("created_at", { ascending: false }),
    db.from("lead_situations").select("lead_id,situation_code").in("lead_id", leadIds),
    db.from("acquisition_team_members").select("user_id,full_name").eq("active", true),
    db.from("markets").select("id,city,state_code"),
  ]);
  for (const error of [propertyError, situationError, teamError, marketError]) if (error) throw new Error(error.message);
  const propertyRows = (properties ?? []) as PropertyRow[];
  const propertyIds = propertyRows.map((property) => property.id);
  const scoreIds = (leads ?? []).flatMap((lead) => lead.current_score_id ? [String(lead.current_score_id)] : []);
  const [{ data: scores, error: scoreError }, { data: valuations, error: valuationError }] = await Promise.all([
    scoreIds.length ? db.from("lead_scores").select("id,score,classification").in("id", scoreIds) : Promise.resolve({ data: [], error: null }),
    propertyIds.length ? db.from("property_valuations").select("property_id,valuation_type,amount,observed_at").in("property_id", propertyIds).in("valuation_type", ["property_value", "equity"]).order("observed_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  if (scoreError) throw new Error(scoreError.message); if (valuationError) throw new Error(valuationError.message);
  const propertyByLead = new Map<string, PropertyRow>();
  propertyRows.forEach((property) => { if (!propertyByLead.has(property.lead_id)) propertyByLead.set(property.lead_id, property); });
  const situationsByLead = new Map<string, string[]>();
  (situations ?? []).forEach((row) => situationsByLead.set(String(row.lead_id), [...(situationsByLead.get(String(row.lead_id)) ?? []), String(row.situation_code)]));
  const scoreById = new Map((scores ?? []).map((score) => [String(score.id), score]));
  const teamById = new Map((team ?? []).map((member) => [String(member.user_id), String(member.full_name)]));
  const marketById = new Map((markets ?? []).map((market) => [String(market.id), `${market.city}, ${market.state_code}`]));
  const valuationByProperty = new Map<string, { value?: number; equity?: number }>();
  (valuations ?? []).forEach((valuation) => { const key=String(valuation.property_id); const current=valuationByProperty.get(key)??{}; if (valuation.valuation_type==="property_value"&&current.value===undefined) current.value=Number(valuation.amount); if(valuation.valuation_type==="equity"&&current.equity===undefined) current.equity=Number(valuation.amount); valuationByProperty.set(key,current); });

  return (leads ?? []).map((lead) => {
    const property = propertyByLead.get(String(lead.id)); const valuation = property ? valuationByProperty.get(property.id) : undefined;
    const score = lead.current_score_id ? scoreById.get(String(lead.current_score_id)) : null;
    return {
      id: String(lead.id), sellerName: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed seller",
      address: property ? formatAddress(property) : "Property address unavailable",
      market: property?.market_id ? marketById.get(property.market_id) ?? null : property?.city && property.state_code ? `${property.city}, ${property.state_code}` : null,
      propertyValueEstimate: valuation?.value ?? (property?.estimated_value === null || property?.estimated_value === undefined ? null : Number(property.estimated_value)),
      propertyValueSource: valuation?.value !== undefined ? "provider" : property?.estimated_value !== null && property?.estimated_value !== undefined ? "homeowner" : null,
      estimatedEquity: valuation?.equity ?? null, motivations: situationsByLead.get(String(lead.id)) ?? [], timeline: property?.desired_timeline ?? null,
      score: score ? Number(score.score) : null, classification: score ? String(score.classification) : null,
      receivedAt: String(lead.created_at), assignedManager: lead.assigned_to ? teamById.get(String(lead.assigned_to)) ?? null : null, status: lead.status as LeadStatus,
    };
  });
}

export async function getAcquisitionDashboardOverview(db:SupabaseClient,leads:AcquisitionLeadCard[]):Promise<AcquisitionDashboardOverview>{
  const leadById=new Map(leads.map(lead=>[lead.id,lead]));
  const [{data:tasks,error:taskError},{data:activities,error:activityError},{data:offers,error:offerError},{data:team,error:teamError}]=await Promise.all([
    db.from("acquisition_tasks").select("id,lead_id,title,details,due_at,assigned_to,status,created_at").eq("status","open").order("due_at",{ascending:true,nullsFirst:false}).limit(12),
    db.from("acquisition_activities").select("id,lead_id,activity_type,status,summary,occurred_at,scheduled_for,created_at").order("created_at",{ascending:false}).limit(10),
    db.from("acquisition_offers").select("id").in("status",["presented","countered"]).limit(1000),
    db.from("acquisition_team_members").select("user_id,full_name").eq("active",true),
  ]);
  for(const error of [taskError,activityError,offerError,teamError])if(error)throw new Error(error.message);
  const teamById=new Map((team??[]).map(member=>[String(member.user_id),String(member.full_name)]));
  const now=Date.now();
  return{
    openTasks:(tasks??[]).flatMap(task=>{const lead=leadById.get(String(task.lead_id));if(!lead)return[];const dueAt=task.due_at?String(task.due_at):null;return[{id:String(task.id),leadId:String(task.lead_id),title:String(task.title),details:task.details,dueAt,assignedTo:task.assigned_to?teamById.get(String(task.assigned_to))??"Assigned team member":null,sellerName:lead.sellerName,address:lead.address,overdue:Boolean(dueAt&&new Date(dueAt).getTime()<now)}]}),
    recentActivities:(activities??[]).flatMap(activity=>{const lead=leadById.get(String(activity.lead_id));if(!lead)return[];return[{id:String(activity.id),leadId:String(activity.lead_id),type:String(activity.activity_type),status:String(activity.status),summary:String(activity.summary),occurredAt:String(activity.occurred_at??activity.scheduled_for??activity.created_at),sellerName:lead.sellerName}]}),
    pendingOffers:(offers??[]).length,
  };
}

export function leadMatchesView(lead: AcquisitionLeadCard, view: PipelineView) {
  if (view === "hot") return lead.classification === "HOT" && !["closed", "lost"].includes(lead.status);
  if (view === "new") return lead.status === "new";
  if (view === "follow-ups") return ["attempting_contact", "nurture", "qualified"].includes(lead.status);
  if (view === "offers") return ["offer_prepared", "offer_sent", "negotiating"].includes(lead.status);
  if (view === "under-contract") return lead.status === "under_contract";
  return lead.status === view;
}

function formatAddress(property: PropertyRow) {
  const locality = [property.city, property.state_code, property.postal_code].filter(Boolean).join(" ");
  return [property.address_line_1, property.address_line_2, locality].filter(Boolean).join(", ");
}

export type LeadProfile = {
  lead: { id:string; sellerName:string; email:string|null; phone:string|null; preferredContact:string|null; status:LeadStatus; source:string; receivedAt:string; assignedManager:string|null };
  property: null | { id:string; marketId:string|null; address:string; market:string|null; propertyType:string|null; condition:string|null; occupancy:string; timeline:string|null; homeownerEstimatedValue:number|null };
  situations: string[];
  score: null | { score:number; classification:string; calculatedAt:string; modelName:string; modelVersion:number; reasons:Array<{points:number;reason:string}> };
  facts: null | { apn:string|null; propertyType:string|null; bedrooms:number|null; bathrooms:number|null; squareFeet:number|null; lotSizeSquareFeet:number|null; yearBuilt:number|null; ownerName:string|null; ownerOccupied:boolean|null; providerKey:string; observedAt:string };
  valuations: Array<{ type:string; amount:number; low:number|null; high:number|null; methodology:string; confidence:number|null; asOf:string|null; providerKey:string }>;
  mortgages: Array<{ position:number|null; lender:string|null; loanType:string|null; originalAmount:number|null; estimatedBalance:number|null; recordingDate:string|null; maturityDate:string|null; providerKey:string }>;
  foreclosure: null | { hasIndicator:boolean|null; stage:string|null; filingDate:string|null; auctionDate:string|null; documentType:string|null; providerKey:string; observedAt:string };
  sales: Array<{ saleDate:string|null; salePrice:number|null; documentType:string|null; providerKey:string }>;
  tax: null | { taxYear:number|null; assessedValue:number|null; annualTaxAmount:number|null; delinquent:boolean|null; providerKey:string };
  hoa: null | { hasHoa:boolean|null; associationName:string|null; feeAmount:number|null; feeFrequency:string|null; providerKey:string };
  timeline: Array<{ type:string; metadata:Record<string,unknown>; createdAt:string }>;
  dealAnalysis: null | { arv:number|null; repairEstimate:number|null; desiredPurchasePrice:number|null; maximumAllowableOffer:number|null; expectedMonthlyRent:number|null; potentialFlipProfit:number|null; potentialMonthlyRentalCashFlow:number|null; notes:string|null; updatedAt:string };
  offers: Array<{ id:string; amount:number; offerDate:string; status:string; notes:string|null; createdAt:string }>;
  activities: Array<{ id:string; type:string; direction:string; status:string; summary:string; occurredAt:string|null; scheduledFor:string|null; createdAt:string; author:string|null }>;
  communications: Array<{ id:string; channel:string; purpose:string; direction:string; destination:string; subject:string|null; body:string; status:string; provider:string; providerMessageId:string|null; createdAt:string }>;
  notes: Array<{ id:string; body:string; pinned:boolean; createdAt:string; author:string|null }>;
  tasks: Array<{ id:string; title:string; details:string|null; dueAt:string|null; status:string; assignedTo:string|null; createdAt:string }>;
  team: Array<{ userId:string; fullName:string }>;
  acquisitionCriteria: AcquisitionCriterion[];
  investmentAnalysis: null | { criterionId:string|null; inputs:InvestmentInputs; results:InvestmentResults; criteriaSnapshot:Record<string,unknown>|null; calculatedAt:string };
  financialOutcome: null | { contractDate:string|null; closingDate:string|null; revenue:number|null; totalCosts:number|null; profit:number|null; notes:string|null; updatedAt:string };
};

export async function getLeadProfile(db: SupabaseClient, leadId: string): Promise<LeadProfile | null> {
  const { data: lead, error: leadError } = await db.from("leads").select("id,first_name,last_name,email,phone,contact_preference,status,source,created_at,assigned_to,current_score_id").eq("id", leadId).maybeSingle();
  if (leadError) throw new Error(leadError.message); if (!lead) return null;
  const [{ data: properties, error: propertyError }, { data: situationRows, error: situationError }, { data: timelineRows, error: timelineError }, { data: teamMember, error: teamError }, {data:teamRows,error:teamRowsError}, activityResult, communicationResult, noteResult, taskResult, offerResult] = await Promise.all([
    db.from("properties").select("id,lead_id,market_id,address_line_1,address_line_2,city,state_code,postal_code,property_type,property_condition,occupancy,desired_timeline,estimated_value,created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(1),
    db.from("lead_situations").select("situation_code").eq("lead_id", leadId),
    db.from("lead_timeline_events").select("event_type,metadata,created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(50),
    lead.assigned_to ? db.from("acquisition_team_members").select("full_name").eq("user_id", lead.assigned_to).maybeSingle() : Promise.resolve({data:null,error:null}),
    db.from("acquisition_team_members").select("user_id,full_name").eq("active",true).order("full_name"),
    db.from("acquisition_activities").select("id,activity_type,direction,status,summary,occurred_at,scheduled_for,created_at,created_by").eq("lead_id",leadId).order("created_at",{ascending:false}).limit(100),
    db.from("communications").select("id,channel,purpose,direction,destination,subject,body,status,provider_key,provider_message_id,created_at").eq("lead_id",leadId).order("created_at",{ascending:false}).limit(200),
    db.from("acquisition_notes").select("id,body,pinned,created_at,created_by").eq("lead_id",leadId).order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(100),
    db.from("acquisition_tasks").select("id,title,details,due_at,status,assigned_to,created_at").eq("lead_id",leadId).order("status").order("due_at",{ascending:true,nullsFirst:false}).limit(100),
    db.from("acquisition_offers").select("id,amount,offer_date,status,notes,created_at").eq("lead_id",leadId).order("offer_date",{ascending:false}),
  ]);
  for (const error of [propertyError,situationError,timelineError,teamError,teamRowsError,activityResult.error,communicationResult.error,noteResult.error,taskResult.error,offerResult.error]) if(error) throw new Error(error.message);
  const rawProperty = properties?.[0] as (PropertyRow & {property_type:string|null;property_condition:string|null;occupancy:string}) | undefined;
  let market:string|null=null;
  if(rawProperty?.market_id){const {data,error}=await db.from("markets").select("city,state_code").eq("id",rawProperty.market_id).maybeSingle();if(error)throw new Error(error.message);if(data)market=`${data.city}, ${data.state_code}`;}
  else if(rawProperty?.city&&rawProperty.state_code)market=`${rawProperty.city}, ${rawProperty.state_code}`;

  let score:LeadProfile["score"]=null;
  if(lead.current_score_id){
    const [{data:scoreRow,error:scoreError},{data:reasonRows,error:reasonError}]=await Promise.all([db.from("lead_scores").select("score,classification,calculated_at,model_id").eq("id",lead.current_score_id).single(),db.from("lead_score_contributions").select("points,reason,created_at").eq("lead_score_id",lead.current_score_id).order("created_at")]);
    if(scoreError||reasonError)throw new Error(scoreError?.message??reasonError?.message);const {data:model,error:modelError}=await db.from("lead_scoring_models").select("name,version").eq("id",scoreRow.model_id).single();if(modelError)throw new Error(modelError.message);
    score={score:Number(scoreRow.score),classification:String(scoreRow.classification),calculatedAt:String(scoreRow.calculated_at),modelName:String(model.name),modelVersion:Number(model.version),reasons:(reasonRows??[]).map(row=>({points:Number(row.points),reason:String(row.reason)}))};
  }

  let facts:LeadProfile["facts"]=null;let valuations:LeadProfile["valuations"]=[];let mortgages:LeadProfile["mortgages"]=[];let foreclosure:LeadProfile["foreclosure"]=null;let sales:LeadProfile["sales"]=[];let tax:LeadProfile["tax"]=null;let hoa:LeadProfile["hoa"]=null;let dealAnalysis:LeadProfile["dealAnalysis"]=null;let investmentAnalysis:LeadProfile["investmentAnalysis"]=null;
  if(rawProperty){
    const [snapshotResult,valuationResult,mortgageResult,foreclosureResult,salesResult,taxResult,hoaResult]=await Promise.all([
      db.from("property_data_snapshots").select("apn,property_type,bedrooms,bathrooms,square_feet,lot_size_square_feet,year_built,owner_name,owner_occupied,provider_key,observed_at").eq("property_id",rawProperty.id).order("observed_at",{ascending:false}).limit(1),
      db.from("property_valuations").select("valuation_type,amount,low_amount,high_amount,methodology,confidence,as_of,provider_key,observed_at").eq("property_id",rawProperty.id).order("observed_at",{ascending:false}),
      db.from("property_mortgage_records").select("lien_position,lender_name,loan_type,original_amount,estimated_balance,recording_date,maturity_date,provider_key,observed_at").eq("property_id",rawProperty.id).order("observed_at",{ascending:false}).limit(10),
      db.from("property_foreclosure_records").select("has_indicator,stage,filing_date,auction_date,document_type,provider_key,observed_at").eq("property_id",rawProperty.id).order("observed_at",{ascending:false}).limit(1),
      db.from("property_sales_history").select("sale_date,sale_price,document_type,provider_key,observed_at").eq("property_id",rawProperty.id).order("sale_date",{ascending:false}).limit(10),
      db.from("property_tax_records").select("tax_year,assessed_value,annual_tax_amount,delinquent,provider_key,observed_at").eq("property_id",rawProperty.id).order("observed_at",{ascending:false}).limit(1),
      db.from("property_hoa_records").select("has_hoa,association_name,fee_amount,fee_frequency,provider_key,observed_at").eq("property_id",rawProperty.id).order("observed_at",{ascending:false}).limit(1),
    ]);
    for(const result of [snapshotResult,valuationResult,mortgageResult,foreclosureResult,salesResult,taxResult,hoaResult])if(result.error)throw new Error(result.error.message);
    const snapshot=snapshotResult.data?.[0];if(snapshot)facts={apn:snapshot.apn,propertyType:snapshot.property_type,bedrooms:nullableNumber(snapshot.bedrooms),bathrooms:nullableNumber(snapshot.bathrooms),squareFeet:nullableNumber(snapshot.square_feet),lotSizeSquareFeet:nullableNumber(snapshot.lot_size_square_feet),yearBuilt:nullableNumber(snapshot.year_built),ownerName:snapshot.owner_name,ownerOccupied:snapshot.owner_occupied,providerKey:String(snapshot.provider_key),observedAt:String(snapshot.observed_at)};
    const seen=new Set<string>();valuations=(valuationResult.data??[]).filter(row=>{if(seen.has(row.valuation_type))return false;seen.add(row.valuation_type);return true;}).map(row=>({type:String(row.valuation_type),amount:Number(row.amount),low:nullableNumber(row.low_amount),high:nullableNumber(row.high_amount),methodology:String(row.methodology),confidence:nullableNumber(row.confidence),asOf:row.as_of,providerKey:String(row.provider_key)}));
    mortgages=(mortgageResult.data??[]).map(row=>({position:nullableNumber(row.lien_position),lender:row.lender_name,loanType:row.loan_type,originalAmount:nullableNumber(row.original_amount),estimatedBalance:nullableNumber(row.estimated_balance),recordingDate:row.recording_date,maturityDate:row.maturity_date,providerKey:String(row.provider_key)}));
    const f=foreclosureResult.data?.[0];if(f)foreclosure={hasIndicator:f.has_indicator,stage:f.stage,filingDate:f.filing_date,auctionDate:f.auction_date,documentType:f.document_type,providerKey:String(f.provider_key),observedAt:String(f.observed_at)};
    sales=(salesResult.data??[]).map(row=>({saleDate:row.sale_date,salePrice:nullableNumber(row.sale_price),documentType:row.document_type,providerKey:String(row.provider_key)}));
    const t=taxResult.data?.[0];if(t)tax={taxYear:nullableNumber(t.tax_year),assessedValue:nullableNumber(t.assessed_value),annualTaxAmount:nullableNumber(t.annual_tax_amount),delinquent:t.delinquent,providerKey:String(t.provider_key)};
    const h=hoaResult.data?.[0];if(h)hoa={hasHoa:h.has_hoa,associationName:h.association_name,feeAmount:nullableNumber(h.fee_amount),feeFrequency:h.fee_frequency,providerKey:String(h.provider_key)};
    const {data:analysis,error:analysisError}=await db.from("property_deal_analyses").select("arv,repair_estimate,desired_purchase_price,maximum_allowable_offer,expected_monthly_rent,potential_flip_profit,potential_monthly_rental_cash_flow,analysis_notes,updated_at").eq("property_id",rawProperty.id).maybeSingle();if(analysisError)throw new Error(analysisError.message);if(analysis)dealAnalysis={arv:nullableNumber(analysis.arv),repairEstimate:nullableNumber(analysis.repair_estimate),desiredPurchasePrice:nullableNumber(analysis.desired_purchase_price),maximumAllowableOffer:nullableNumber(analysis.maximum_allowable_offer),expectedMonthlyRent:nullableNumber(analysis.expected_monthly_rent),potentialFlipProfit:nullableNumber(analysis.potential_flip_profit),potentialMonthlyRentalCashFlow:nullableNumber(analysis.potential_monthly_rental_cash_flow),notes:analysis.analysis_notes,updatedAt:String(analysis.updated_at)};
    const {data:investment,error:investmentError}=await db.from("property_investment_analyses").select("criterion_id,purchase_price,arv,estimated_repairs,closing_costs,holding_costs,financing_costs,selling_costs,expected_monthly_rent,annual_property_taxes,annual_insurance,monthly_hoa,property_management_percent,total_investment,potential_flip_profit,roi_percent,gross_rental_yield_percent,estimated_monthly_cash_flow,cap_rate_percent,maximum_allowable_offer,criteria_snapshot,calculated_at").eq("property_id",rawProperty.id).maybeSingle();if(investmentError)throw new Error(investmentError.message);if(investment)investmentAnalysis={criterionId:investment.criterion_id?String(investment.criterion_id):null,inputs:{purchasePrice:Number(investment.purchase_price),arv:Number(investment.arv),estimatedRepairs:Number(investment.estimated_repairs),closingCosts:Number(investment.closing_costs),holdingCosts:Number(investment.holding_costs),financingCosts:Number(investment.financing_costs),sellingCosts:Number(investment.selling_costs),expectedMonthlyRent:Number(investment.expected_monthly_rent),annualPropertyTaxes:Number(investment.annual_property_taxes),annualInsurance:Number(investment.annual_insurance),monthlyHoa:Number(investment.monthly_hoa),propertyManagementPercent:Number(investment.property_management_percent)},results:{totalInvestment:Number(investment.total_investment),potentialFlipProfit:Number(investment.potential_flip_profit),roiPercent:nullableNumber(investment.roi_percent),grossRentalYieldPercent:nullableNumber(investment.gross_rental_yield_percent),estimatedMonthlyCashFlow:Number(investment.estimated_monthly_cash_flow),capRatePercent:nullableNumber(investment.cap_rate_percent),maximumAllowableOffer:nullableNumber(investment.maximum_allowable_offer)},criteriaSnapshot:investment.criteria_snapshot as Record<string,unknown>|null,calculatedAt:String(investment.calculated_at)};
  }
  const criteriaSettings=await getCriteriaSettings(db);const acquisitionCriteria=criteriaSettings.criteria.filter(item=>item.active);
  const {data:outcome,error:outcomeError}=await db.from("acquisition_financial_outcomes").select("contract_date,closing_date,revenue,total_costs,profit,notes,updated_at").eq("lead_id",leadId).maybeSingle();if(outcomeError)throw new Error(outcomeError.message);const financialOutcome=outcome?{contractDate:outcome.contract_date,closingDate:outcome.closing_date,revenue:nullableNumber(outcome.revenue),totalCosts:nullableNumber(outcome.total_costs),profit:nullableNumber(outcome.profit),notes:outcome.notes,updatedAt:String(outcome.updated_at)}:null;
  const teamNameById=new Map((teamRows??[]).map(row=>[String(row.user_id),String(row.full_name)]));
  return {lead:{id:String(lead.id),sellerName:[lead.first_name,lead.last_name].filter(Boolean).join(" ")||"Unnamed seller",email:lead.email,phone:lead.phone,preferredContact:lead.contact_preference,status:lead.status as LeadStatus,source:String(lead.source),receivedAt:String(lead.created_at),assignedManager:teamMember?.full_name?String(teamMember.full_name):null},property:rawProperty?{id:rawProperty.id,marketId:rawProperty.market_id,address:formatAddress(rawProperty),market,propertyType:rawProperty.property_type,condition:rawProperty.property_condition,occupancy:rawProperty.occupancy,timeline:rawProperty.desired_timeline,homeownerEstimatedValue:nullableNumber(rawProperty.estimated_value)}:null,situations:(situationRows??[]).map(row=>String(row.situation_code)),score,facts,valuations,mortgages,foreclosure,sales,tax,hoa,timeline:(timelineRows??[]).map(row=>({type:String(row.event_type),metadata:(row.metadata??{}) as Record<string,unknown>,createdAt:String(row.created_at)})),dealAnalysis,offers:(offerResult.data??[]).map(row=>({id:String(row.id),amount:Number(row.amount),offerDate:String(row.offer_date),status:String(row.status),notes:row.notes,createdAt:String(row.created_at)})),activities:(activityResult.data??[]).map(row=>({id:String(row.id),type:String(row.activity_type),direction:String(row.direction),status:String(row.status),summary:String(row.summary),occurredAt:row.occurred_at,scheduledFor:row.scheduled_for,createdAt:String(row.created_at),author:row.created_by?teamNameById.get(String(row.created_by))??null:null})),communications:(communicationResult.data??[]).map(row=>({id:String(row.id),channel:String(row.channel),purpose:String(row.purpose),direction:String(row.direction),destination:String(row.destination),subject:row.subject,body:String(row.body),status:String(row.status),provider:String(row.provider_key),providerMessageId:row.provider_message_id,createdAt:String(row.created_at)})),notes:(noteResult.data??[]).map(row=>({id:String(row.id),body:String(row.body),pinned:Boolean(row.pinned),createdAt:String(row.created_at),author:row.created_by?teamNameById.get(String(row.created_by))??null:null})),tasks:(taskResult.data??[]).map(row=>({id:String(row.id),title:String(row.title),details:row.details,dueAt:row.due_at,status:String(row.status),assignedTo:row.assigned_to?teamNameById.get(String(row.assigned_to))??null:null,createdAt:String(row.created_at)})),team:(teamRows??[]).map(row=>({userId:String(row.user_id),fullName:String(row.full_name)})),acquisitionCriteria,investmentAnalysis,financialOutcome};
}

function nullableNumber(value:unknown){return value===null||value===undefined?null:Number(value);}
