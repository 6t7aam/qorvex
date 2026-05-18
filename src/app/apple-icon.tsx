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
            "radial-gradient(circle at top left, rgba(124,58,237,0.35), transparent 42%), radial-gradient(circle at bottom right, rgba(6,182,212,0.25), transparent 40%), linear-gradient(135deg, #080810 0%, #0d0d12 100%)",
          borderRadius: 36,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            boxShadow: "0 18px 40px rgba(124,58,237,0.35)",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          Q
        </div>
      </div>
    ),
    size,
  );
}
