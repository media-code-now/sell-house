export type ScoringOperator = "equals" | "not_equals" | "in" | "contains" | "gte" | "lte" | "gt" | "lt" | "truthy";

export type ScoringRule = {
  id: string;
  ruleKey: string;
  factKey: string;
  operator: ScoringOperator;
  comparisonValue: unknown;
  weight: number;
  reason: string;
  priority: number;
};

export type ScoreBand = {
  classification: string;
  minimumScore: number;
  maximumScore: number;
};

export type LeadScoringFacts = Record<string, unknown>;

export type ScoreContribution = {
  ruleId: string;
  ruleKey: string;
  points: number;
  reason: string;
  factKey: string;
  factValue: unknown;
};

export type LeadScoreResult = {
  rawScore: number;
  score: number;
  classification: string;
  contributions: ScoreContribution[];
};

export type LeadScoreView = {
  score: number;
  classification: string;
  calculatedAt: string;
  modelName: string;
  modelVersion: number;
  reasons: Array<{ points: number; reason: string }>;
};
