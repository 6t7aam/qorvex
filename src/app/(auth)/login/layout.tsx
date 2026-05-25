import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Sign in · Qorvex AI Mobile App Builder",
  description:
    "Sign in to Qorvex to continue building, editing, and exporting your AI-generated React Native and Expo apps.",
  path: "/login",
  index: false,
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
