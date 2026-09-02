export const propertyTypes = ["Single Family", "Townhouse", "Condo", "Duplex", "Multifamily", "Other"] as const;
export const propertyConditions = ["Excellent", "Good", "Needs some repairs", "Needs major repairs", "Major renovation"] as const;
export const sellingReasons = ["Facing foreclosure", "Behind on mortgage", "Inherited property", "Divorce/separation", "Problem tenants", "Vacant property", "Relocating", "Cannot afford repairs", "Tired landlord", "Need cash", "Selling another property", "Other"] as const;
export const sellingTimelines = ["Immediately", "Within 30 days", "1-3 months", "3+ months", "Just exploring"] as const;

export type QuestionnaireAnswers = {
  address: string;
  propertyType: string;
  condition: string;
  reasons: string[];
  timeline: string;
  estimatedValue: string;
};

export const emptyAnswers: QuestionnaireAnswers = { address: "", propertyType: "", condition: "", reasons: [], timeline: "", estimatedValue: "" };

export function validateDraftStep(step: number, answers: Partial<QuestionnaireAnswers>) {
  if (step >= 1 && (!answers.address || answers.address.trim().length < 5 || answers.address.length > 240)) return "Enter a complete property address.";
  if (step >= 2 && !propertyTypes.includes(answers.propertyType as typeof propertyTypes[number])) return "Choose a property type.";
  if (step >= 3 && !propertyConditions.includes(answers.condition as typeof propertyConditions[number])) return "Choose the property condition.";
  if (step >= 4 && (!Array.isArray(answers.reasons) || answers.reasons.length === 0 || answers.reasons.some((value) => !sellingReasons.includes(value as typeof sellingReasons[number])))) return "Choose at least one reason for selling.";
  if (step >= 5 && !sellingTimelines.includes(answers.timeline as typeof sellingTimelines[number])) return "Choose a selling timeline.";
  if (step >= 6 && answers.estimatedValue && !/^\d{1,12}$/.test(answers.estimatedValue.replace(/[$,\s]/g, ""))) return "Enter a whole-dollar estimate or leave it blank.";
  return null;
}
