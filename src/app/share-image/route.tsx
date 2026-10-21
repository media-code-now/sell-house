import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#122028", color: "#ffffff", fontFamily: "sans-serif", borderBottom: "16px solid #c88358" }}>
      <div style={{ display: "flex", color: "#edb891", fontSize: 32 }}>HAVEN HOME OFFERS</div>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>A simpler way to sell your Las Vegas Valley home.</div>
      <div style={{ display: "flex", fontSize: 28, color: "#edb891" }}>Sell as-is · No agent commission · No obligation</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
