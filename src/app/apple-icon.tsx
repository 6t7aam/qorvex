import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(circle at top left, rgba(124,58,237,0.45), transparent 45%), radial-gradient(circle at bottom right, rgba(6,182,212,0.4), transparent 45%), linear-gradient(135deg, #080810 0%, #0d0d12 100%)",
          borderRadius: 36,
          position: "relative",
        }}
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 680 680"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vgrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="glow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="ringgrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          <circle
            cx="340"
            cy="340"
            r="260"
            fill="none"
            stroke="url(#ringgrad)"
            strokeWidth="2"
            opacity="0.6"
          />

          <polygon
            points="340,100 566,220 566,460 340,580 114,460 114,220"
            fill="url(#glow1)"
          />
          <polygon
            points="340,100 566,220 566,460 340,580 114,460 114,220"
            fill="none"
            stroke="url(#vgrad)"
            strokeWidth="3"
            opacity="0.85"
          />

          <circle
            cx="330"
            cy="330"
            r="155"
            fill="none"
            stroke="url(#vgrad)"
            strokeWidth="34"
          />
          <line
            x1="430"
            y1="420"
            x2="510"
            y2="500"
            stroke="url(#vgrad)"
            strokeWidth="34"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
