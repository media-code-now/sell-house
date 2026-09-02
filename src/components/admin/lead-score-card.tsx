import { Flame, ListChecks } from "lucide-react";
import type { LeadScoreView } from "@/lib/lead-scoring/types";

const styles: Record<string, string> = {
  HOT: "bg-[#f9e6dc] text-[#934924]",
  WARM: "bg-[#f7efd8] text-[#7b5b0c]",
  NURTURE: "bg-[#e7eeea] text-[#496454]",
};

export function LeadScoreCard({ result }: { result: LeadScoreView }) {
  return <section className="rounded-2xl border border-[var(--line)] bg-white p-6" aria-label="Lead score">
    <div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-[var(--ink-soft)]">Motivation score</p><div className="mt-3 flex items-end gap-3"><strong className="font-display text-5xl leading-none">{result.score}</strong><span className="pb-1 text-sm text-[var(--ink-soft)]">/ 100</span></div></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${styles[result.classification] ?? "bg-[var(--paper)] text-[var(--ink)]"}`}><Flame className="size-3.5"/>{result.classification}</span></div>
    <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--paper)]"><div className="h-full rounded-full bg-[var(--copper)]" style={{ width: `${result.score}%` }}/></div>
    <div className="mt-7 border-t border-[var(--line)] pt-6"><h3 className="flex items-center gap-2 text-sm font-bold"><ListChecks className="size-4 text-[var(--copper)]"/>Why this lead received its score</h3>{result.reasons.length ? <ul className="mt-4 grid gap-3">{result.reasons.map((item, index) => <li key={`${item.reason}-${index}`} className="flex items-start justify-between gap-4 text-sm"><span className="leading-6 text-[var(--ink-soft)]">{item.reason}</span><strong className={item.points >= 0 ? "text-[#496454]" : "text-[#934924]"}>{item.points >= 0 ? "+" : ""}{item.points}</strong></li>)}</ul> : <p className="mt-4 text-sm text-[var(--ink-soft)]">No scoring rules contributed points.</p>}</div>
    <p className="mt-6 text-[.68rem] text-[var(--ink-soft)]">Model: {result.modelName} v{result.modelVersion} · Calculated {new Date(result.calculatedAt).toLocaleString()}</p>
  </section>;
}
