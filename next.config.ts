import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  trailingSlash: true,
  async headers() {
    return ["/api/:path*", "/acquisitions/:path*", "/offer/thank-you/", "/unsubscribe/"].map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

export default nextConfig;
