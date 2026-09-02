import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcquisitionCriterion } from "./investment-calculator";

export type AcquisitionMarket = { id:string; name:string };
export type CriterionRecord = AcquisitionCriterion & { isDefault:boolean; active:boolean };

export async function getCriteriaSettings(db:SupabaseClient){
  const [{data:markets,error:marketError},{data:rows,error:criteriaError}]=await Promise.all([db.from("markets").select("id,city,state_code").eq("active",true).order("state_code").order("city"),db.from("market_acquisition_criteria").select("id,market_id,name,mao_method,arv_percentage,target_profit_amount,deduct_repairs,deduct_closing_costs,deduct_holding_costs,deduct_financing_costs,deduct_selling_costs,is_default,active").order("name")]);
  if(marketError)throw new Error(marketError.message);if(criteriaError)throw new Error(criteriaError.message);const marketList:AcquisitionMarket[]=(markets??[]).map(row=>({id:String(row.id),name:`${row.city}, ${row.state_code}`}));const names=new Map(marketList.map(market=>[market.id,market.name]));const criteria:CriterionRecord[]=(rows??[]).map(row=>({id:String(row.id),marketId:String(row.market_id),marketName:names.get(String(row.market_id))??"Unknown market",name:String(row.name),method:row.mao_method as CriterionRecord["method"],arvPercentage:row.arv_percentage===null?null:Number(row.arv_percentage),targetProfitAmount:row.target_profit_amount===null?null:Number(row.target_profit_amount),deductRepairs:Boolean(row.deduct_repairs),deductClosingCosts:Boolean(row.deduct_closing_costs),deductHoldingCosts:Boolean(row.deduct_holding_costs),deductFinancingCosts:Boolean(row.deduct_financing_costs),deductSellingCosts:Boolean(row.deduct_selling_costs),isDefault:Boolean(row.is_default),active:Boolean(row.active)}));return{markets:marketList,criteria};
}
