import type { LeadScoreResult, LeadScoringFacts, ScoreBand, ScoringRule } from "./types";

function equal(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function ruleMatches(rule: ScoringRule, facts: LeadScoringFacts) {
  const fact = facts[rule.factKey];
  switch (rule.operator) {
    case "equals": return equal(fact, rule.comparisonValue);
    case "not_equals": return !equal(fact, rule.comparisonValue);
    case "in": return Array.isArray(rule.comparisonValue) && rule.comparisonValue.some((value) => equal(value, fact));
    case "contains": return Array.isArray(fact) && fact.some((value) => equal(value, rule.comparisonValue));
    case "truthy": return fact === true;
    case "gte": case "lte": case "gt": case "lt": {
      const left = numeric(fact); const right = numeric(rule.comparisonValue);
      if (left === null || right === null) return false;
      if (rule.operator === "gte") return left >= right;
      if (rule.operator === "lte") return left <= right;
      if (rule.operator === "gt") return left > right;
      return left < right;
    }
  }
}

export function calculateLeadScore(facts: LeadScoringFacts, rules: ScoringRule[], bands: ScoreBand[]): LeadScoreResult {
  const contributions = rules
    .filter((rule) => ruleMatches(rule, facts))
    .sort((a, b) => a.priority - b.priority)
    .map((rule) => ({ ruleId: rule.id, ruleKey: rule.ruleKey, points: rule.weight, reason: rule.reason, factKey: rule.factKey, factValue: facts[rule.factKey] ?? null }));
  const rawScore = contributions.reduce((total, contribution) => total + contribution.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const band = bands.find((item) => score >= item.minimumScore && score <= item.maximumScore);
  if (!band) throw new Error(`No configured classification band contains score ${score}`);
  return { rawScore, score, classification: band.classification, contributions };
}
