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
            "radial-gradient(circle at top left, rgba(124,58,237,0.35), transparent 42%), radial-gradient(circle at bottom right, rgba(6,182,212,0.25), transparent 40%), linear-gradient(135deg, #080810 0%, #0d0d12 100%)",
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 24px 60px rgba(124,58,237,0.35)",
                fontSize: 42,
                fontWeight: 800,
              }}
            >
              Q
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 44, fontWeight: 800 }}>Qorvex</div>
              <div style={{ fontSize: 20, color: "rgba(255,255,255,0.72)" }}>
                AI mobile app builder for React Native and Expo
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.04,
                maxWidth: 900,
              }}
            >
              Turn ideas into mobile apps with AI
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.74)",
                maxWidth: 860,
              }}
            >
              Create, preview, edit, and export React Native and Expo apps from
              natural language prompts.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
