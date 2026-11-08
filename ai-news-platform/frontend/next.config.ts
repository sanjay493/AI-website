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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "i9.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "yt3.ggpht.com", pathname: "/**" },
    ],
  },
  /** Former blog/category/trending pages were folded into the home page — keep old links working. */
  async redirects() {
    return [
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:slug*", destination: "/", permanent: true },
      { source: "/category/:slug*", destination: "/", permanent: true },
      { source: "/youtube-trending", destination: "/", permanent: true },
    ];
  },
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
