import { BrandMark } from "@/components/brand-mark";
import { ThankYouContent } from "@/components/thank-you-content";

export const metadata = { title: "We’re Reviewing Your Property", robots: { index: false, follow: false } };

export default function ThankYouPage() {
  return <main className="min-h-svh bg-[var(--paper)]"><header className="border-b border-[var(--line)] bg-white"><div className="container-shell flex h-20 items-center justify-between"><BrandMark/><span className="text-xs font-bold text-[var(--ink-soft)]">Request received</span></div></header><ThankYouContent/></main>;
}
