import { ImageResponse } from "next/og";

export const runtime = "edge";

const BRAND_GRADIENT = "linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          color: "#fff",
          padding: "56px",
          fontFamily: "sans-serif",
          background:
            "radial-gradient(circle at 12% 14%, rgba(124,58,237,0.55), transparent 45%), radial-gradient(circle at 88% 86%, rgba(6,182,212,0.45), transparent 45%), linear-gradient(135deg, #06060c 0%, #0d0d18 60%, #0a0a14 100%)",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.07,
            backgroundImage:
              "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Soft inner frame */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: 40,
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />

        {/* Top gradient hairline */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 120,
            right: 120,
            height: 1,
            display: "flex",
            background:
              "linear-gradient(90deg, transparent, rgba(168,85,247,0.85), rgba(34,211,238,0.85), transparent)",
          }}
        />

        {/* Main content column */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          {/* Brand header */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 100,
                height: 100,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -12,
                  borderRadius: 28,
                  background:
                    "radial-gradient(circle, rgba(168,85,247,0.45), transparent 65%)",
                  display: "flex",
                  filter: "blur(8px)",
                }}
              />
              <svg
                width="96"
                height="96"
                viewBox="0 0 680 680"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="ogmark"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#c5b4ff" />
                    <stop offset="100%" stopColor="#7fe8ff" />
                  </linearGradient>
                  <linearGradient
                    id="ogfill"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <circle
                  cx="340"
                  cy="340"
                  r="320"
                  fill="none"
                  stroke="url(#ogmark)"
                  strokeWidth="2"
                  opacity="0.45"
                />
                <polygon
                  points="340,80 580,210 580,470 340,600 100,470 100,210"
                  fill="url(#ogfill)"
                />
                <polygon
                  points="340,80 580,210 580,470 340,600 100,470 100,210"
                  fill="none"
                  stroke="url(#ogmark)"
                  strokeWidth="4"
                  opacity="0.85"
                />
                <circle
                  cx="330"
                  cy="330"
                  r="155"
                  fill="none"
                  stroke="url(#ogmark)"
                  strokeWidth="36"
                />
                <line
                  x1="430"
                  y1="420"
                  x2="510"
                  y2="500"
                  stroke="url(#ogmark)"
                  strokeWidth="36"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  letterSpacing: -1.5,
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #c5b4ff 55%, #7fe8ff 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Qorvex
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 22,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: 0.2,
                }}
              >
                AI mobile app builder · React Native &amp; Expo
              </div>
            </div>
          </div>

          {/* Hero headline + sub */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              maxWidth: 880,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 18,
                color: "rgba(255,255,255,0.8)",
                padding: "8px 16px",
                width: "fit-content",
                borderRadius: 999,
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.32)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  display: "flex",
                  background: "#a78bfa",
                  boxShadow: "0 0 14px rgba(168,85,247,0.9)",
                }}
              />
              Powered by Gemini AI
            </div>
            <div
              style={{
                fontSize: 82,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: -3,
                color: "#fff",
              }}
            >
              Turn an idea into a
            </div>
            <div
              style={{
                fontSize: 82,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: -3,
                background: BRAND_GRADIENT,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              mobile app — in minutes.
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.74)",
                maxWidth: 820,
              }}
            >
              One prompt generates a full React Native + Expo app. Preview live,
              refine by chat, export to GitHub.
            </div>
          </div>

          {/* Bottom trust row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 22,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              {[
                "React Native",
                "Expo",
                "Supabase",
                "Gemini AI",
              ].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 18,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 20,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#34d399",
                  boxShadow: "0 0 14px rgba(52,211,153,0.7)",
                }}
              />
              Free plan · No credit card
            </div>
          </div>
        </div>

        {/* Decorative phone mock in the right column (soft, never covers text) */}
        <div
          style={{
            position: "absolute",
            right: -40,
            top: 120,
            width: 320,
            height: 640,
            display: "flex",
            opacity: 0.18,
            transform: "rotate(8deg)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 56,
              display: "flex",
              border: "2px solid rgba(168,85,247,0.5)",
              background:
                "linear-gradient(160deg, rgba(124,58,237,0.4), rgba(6,182,212,0.35))",
            }}
          />
        </div>

        {/* Bottom-right URL chip */}
        <div
          style={{
            position: "absolute",
            right: 56,
            bottom: 30,
            display: "flex",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          qorvex.mov
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, immutable, no-transform, max-age=3600, s-maxage=31536000",
      },
    },
  );
}
