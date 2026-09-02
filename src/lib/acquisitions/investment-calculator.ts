export type InvestmentInputs = {
  purchasePrice: number;
  arv: number;
  estimatedRepairs: number;
  closingCosts: number;
  holdingCosts: number;
  financingCosts: number;
  sellingCosts: number;
  expectedMonthlyRent: number;
  annualPropertyTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  propertyManagementPercent: number;
};

export type AcquisitionCriterion = {
  id: string;
  marketId: string;
  marketName: string;
  name: string;
  method: "arv_percentage_minus_costs" | "target_profit_minus_costs";
  arvPercentage: number | null;
  targetProfitAmount: number | null;
  deductRepairs: boolean;
  deductClosingCosts: boolean;
  deductHoldingCosts: boolean;
  deductFinancingCosts: boolean;
  deductSellingCosts: boolean;
  isDefault?: boolean;
};

export type InvestmentResults = {
  totalInvestment: number;
  potentialFlipProfit: number;
  roiPercent: number | null;
  grossRentalYieldPercent: number | null;
  estimatedMonthlyCashFlow: number;
  capRatePercent: number | null;
  maximumAllowableOffer: number | null;
};

function money(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
function percent(value: number) { return Math.round((value + Number.EPSILON) * 10000) / 10000; }

export function calculateInvestment(inputs: InvestmentInputs, criterion: AcquisitionCriterion | null): InvestmentResults {
  for (const [key, value] of Object.entries(inputs)) {
    if (!Number.isFinite(value)) throw new Error(`${key} must be a finite number`);
    if (key !== "propertyManagementPercent" && value < 0) throw new Error(`${key} cannot be negative`);
  }
  if (inputs.propertyManagementPercent < 0 || inputs.propertyManagementPercent > 100) throw new Error("Property management must be between 0% and 100%");

  const totalInvestment = inputs.purchasePrice + inputs.estimatedRepairs + inputs.closingCosts + inputs.holdingCosts + inputs.financingCosts + inputs.sellingCosts;
  const potentialFlipProfit = inputs.arv - totalInvestment;
  const annualRent = inputs.expectedMonthlyRent * 12;
  const annualManagement = annualRent * (inputs.propertyManagementPercent / 100);
  const annualOperatingExpenses = inputs.annualPropertyTaxes + inputs.annualInsurance + (inputs.monthlyHoa * 12) + annualManagement;
  const annualNoi = annualRent - annualOperatingExpenses;
  const estimatedMonthlyCashFlow = annualNoi / 12;

  let maximumAllowableOffer: number | null = null;
  if (criterion) {
    const base = criterion.method === "arv_percentage_minus_costs"
      ? inputs.arv * (criterion.arvPercentage ?? 0)
      : inputs.arv - (criterion.targetProfitAmount ?? 0);
    const deductions = (criterion.deductRepairs ? inputs.estimatedRepairs : 0)
      + (criterion.deductClosingCosts ? inputs.closingCosts : 0)
      + (criterion.deductHoldingCosts ? inputs.holdingCosts : 0)
      + (criterion.deductFinancingCosts ? inputs.financingCosts : 0)
      + (criterion.deductSellingCosts ? inputs.sellingCosts : 0);
    maximumAllowableOffer = money(Math.max(0, base - deductions));
  }

  return {
    totalInvestment: money(totalInvestment),
    potentialFlipProfit: money(potentialFlipProfit),
    roiPercent: totalInvestment > 0 ? percent((potentialFlipProfit / totalInvestment) * 100) : null,
    grossRentalYieldPercent: inputs.purchasePrice > 0 ? percent((annualRent / inputs.purchasePrice) * 100) : null,
    estimatedMonthlyCashFlow: money(estimatedMonthlyCashFlow),
    capRatePercent: inputs.purchasePrice > 0 ? percent((annualNoi / inputs.purchasePrice) * 100) : null,
    maximumAllowableOffer,
  };
}

export function criterionSnapshot(criterion: AcquisitionCriterion | null) {
  if (!criterion) return null;
  return {
    id: criterion.id, marketId: criterion.marketId, marketName: criterion.marketName, name: criterion.name,
    method: criterion.method, arvPercentage: criterion.arvPercentage, targetProfitAmount: criterion.targetProfitAmount,
    deductions: { repairs: criterion.deductRepairs, closingCosts: criterion.deductClosingCosts, holdingCosts: criterion.deductHoldingCosts, financingCosts: criterion.deductFinancingCosts, sellingCosts: criterion.deductSellingCosts },
  };
}
