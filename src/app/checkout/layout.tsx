import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Checkout",
  description: "Pay for your Qorvex subscription with crypto.",
  path: "/checkout",
});

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background-primary text-text-primary">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.18)_0%,rgba(37,99,235,0.10)_45%,rgba(8,8,8,0.95)_100%)]" />
      <div className="pointer-events-none absolute left-[-12rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-violet-700/25 blur-[160px] animate-pulse-slow" />
      <div className="pointer-events-none absolute right-[-10rem] top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[140px] animate-pulse-slow [animation-delay:1.5s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
