import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background-primary text-text-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-[460px] w-[460px] rounded-full opacity-40 blur-[140px]"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
      />

      <Link
        href="/"
        className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Qorvex
      </Link>

      {children}
    </div>
  );
}
