import type { NextConfig } from "next";

/** FastAPI origin for `rewrites()` — must reach the API from inside the Node process (Docker: `http://api:8000`, not localhost). */
function internalRewriteOrigin(): string {
  const explicit = process.env.INTERNAL_API_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const serverApi = process.env.SERVER_API_URL?.trim();
  if (serverApi) {
    try {
      return new URL(serverApi).origin;
    } catch {
      /* ignore invalid */
    }
  }

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
