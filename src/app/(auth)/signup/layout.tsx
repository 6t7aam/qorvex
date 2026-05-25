import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Start free · Qorvex AI Mobile App Builder",
  description:
    "Create a free Qorvex account and generate your first React Native + Expo mobile app from a single prompt — no credit card required.",
  path: "/signup",
  keywords: [
    "sign up Qorvex",
    "free AI app builder signup",
    "create React Native app online",
    "AI app builder free trial",
  ],
});

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
