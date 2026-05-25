import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(124,58,237,0.45), transparent 42%), radial-gradient(circle at bottom right, rgba(6,182,212,0.35), transparent 40%), linear-gradient(135deg, #080810 0%, #0d0d12 100%)",
          color: "#fff",
          padding: "64px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 36,
            borderRadius: 36,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.08,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <svg
              width="92"
              height="92"
              viewBox="0 0 680 680"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="ogvgrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient
                  id="ogglow"
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
                stroke="url(#ogvgrad)"
                strokeWidth="2"
                opacity="0.4"
              />
              <polygon
                points="340,80 580,210 580,470 340,600 100,470 100,210"
                fill="url(#ogglow)"
              />
              <polygon
                points="340,80 580,210 580,470 340,600 100,470 100,210"
                fill="none"
                stroke="url(#ogvgrad)"
                strokeWidth="3"
                opacity="0.8"
              />
              <circle
                cx="330"
                cy="330"
                r="155"
                fill="none"
                stroke="url(#ogvgrad)"
                strokeWidth="34"
              />
              <line
                x1="430"
                y1="420"
                x2="510"
                y2="500"
                stroke="url(#ogvgrad)"
                strokeWidth="34"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: -1,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #c5b4ff 50%, #7fe8ff 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Qorvex
              </div>
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.72)" }}>
                AI mobile app builder for React Native & Expo
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 78,
                fontWeight: 800,
                lineHeight: 1.04,
                maxWidth: 900,
                letterSpacing: -2,
              }}
            >
              Turn ideas into
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                mobile apps with AI
              </span>
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.74)",
                maxWidth: 880,
              }}
            >
              Create, preview, edit, and export React Native apps from
              natural language prompts.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 22,
            }}
          >
            <div style={{ display: "flex", gap: 14 }}>
              {["React Native", "Expo", "Supabase", "Gemini"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 18,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              qorvex.mov
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, immutable, no-transform, max-age=60, s-maxage=31536000",
      },
    },
  );
}
