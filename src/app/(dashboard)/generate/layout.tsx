import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "AI App Generator",
  description:
    "Describe your app idea and generate a React Native Expo mobile app with Qorvex AI.",
  path: "/generate",
});

export default function GenerateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
