import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Log in to Qorvex",
  description:
    "Log in to Qorvex to continue building and editing AI-generated mobile apps.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
