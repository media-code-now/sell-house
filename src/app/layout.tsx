import { siteUrl, siteName } from "@/lib/seo";
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { SiteStructuredData } from "@/components/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Haven Home Offers | A Simpler Way to Sell", template: "%s | Haven Home Offers" },
  applicationName: siteName,
  referrer: "strict-origin-when-cross-origin",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "so8Txw_CB94tX2afbeb9Yjd8RQHtlnuMIgdd7zcnRdQ",
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  description: "Explore a straightforward, no-pressure cash offer for your home in Las Vegas, Henderson, North Las Vegas, Summerlin, or the southwest valley.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteStructuredData />
        <Suspense fallback={null}><AnalyticsTracker/></Suspense>
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-VYN7MJHQEE" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VYN7MJHQEE');
          `}
        </Script>
      </body>
    </html>
  );
}
