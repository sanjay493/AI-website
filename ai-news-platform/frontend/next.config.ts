import type { NextConfig } from "next";

/** FastAPI in Docker (`http://api:8000`) or local dev. Baked at image build via INTERNAL_API_ORIGIN. */
function internalRewriteOrigin(): string {
  const o = process.env.INTERNAL_API_ORIGIN?.trim();
  if (o) return o.replace(/\/$/, "");
  return "http://127.0.0.1:8000";
}

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const origin = internalRewriteOrigin();
    return [
      {
        source: "/api/v1/:path*",
        destination: `${origin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
