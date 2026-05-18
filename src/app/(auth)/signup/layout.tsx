import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Create your Qorvex account",
  description:
    "Join Qorvex and start creating mobile apps with AI using natural language prompts.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
