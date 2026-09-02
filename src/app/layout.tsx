import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://havenhomeoffers.com"),
  title: { default: "Haven Home Offers | A Simpler Way to Sell", template: "%s | Haven Home Offers" },
  description: "Explore a straightforward, no-pressure cash offer for your home in Las Vegas, Henderson, North Las Vegas, Summerlin, or the southwest valley.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Suspense fallback={null}><AnalyticsTracker/></Suspense>{children}</body></html>;
}
