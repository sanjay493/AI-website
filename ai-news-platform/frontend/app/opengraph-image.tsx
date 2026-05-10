import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-config";

export const runtime = "nodejs";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #18181b 0%, #27272a 42%, #5b21b6 100%)",
          padding: 72,
        }}
      >
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: -0.02,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            fontWeight: 500,
            color: "#d4d4d8",
            maxWidth: 960,
            lineHeight: 1.35,
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
