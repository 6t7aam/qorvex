import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Public PNG of the Qorvex brand mark used inside transactional emails.
 *
 * Rendered as a 320x320 PNG (retina-friendly when displayed at 160x160) on a
 * solid dark background so the image looks the same on every mail client.
 *
 * Served from the project root: https://www.qorvex.mov/email-logo.png
 *
 * Long CDN cache because the artwork rarely changes; bump the ?v= query
 * string in email templates if you ever need to invalidate it.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(124,58,237,0.55), transparent 50%), radial-gradient(circle at bottom right, rgba(6,182,212,0.45), transparent 50%), linear-gradient(135deg, #080810 0%, #0d0d18 100%)",
          borderRadius: 64,
          position: "relative",
        }}
      >
        <svg
          width="240"
          height="240"
          viewBox="0 0 680 680"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vgrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c5b4ff" />
              <stop offset="100%" stopColor="#7fe8ff" />
            </linearGradient>
            <linearGradient id="glow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="ringgrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          <circle
            cx="340"
            cy="340"
            r="300"
            fill="none"
            stroke="url(#ringgrad)"
            strokeWidth="3"
            opacity="0.55"
          />

          <polygon
            points="340,80 580,210 580,470 340,600 100,470 100,210"
            fill="url(#glow1)"
          />
          <polygon
            points="340,80 580,210 580,470 340,600 100,470 100,210"
            fill="none"
            stroke="url(#vgrad)"
            strokeWidth="4"
            opacity="0.9"
          />

          <circle
            cx="330"
            cy="330"
            r="155"
            fill="none"
            stroke="url(#vgrad)"
            strokeWidth="36"
          />
          <line
            x1="430"
            y1="420"
            x2="510"
            y2="500"
            stroke="url(#vgrad)"
            strokeWidth="36"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      width: 320,
      height: 320,
      headers: {
        "Cache-Control":
          "public, immutable, no-transform, max-age=3600, s-maxage=31536000",
      },
    },
  );
}
