import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Templates } from "@/components/landing/Templates";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle:
    "Qorvex — AI Mobile App Builder for React Native & Expo",
  description:
    "Build full iOS & Android apps from a single prompt. Qorvex generates React Native + Expo code, live mobile preview, AI chat editor, and one-click GitHub export. Start free.",
  path: "/",
  keywords: [
    "AI mobile app builder online",
    "prompt to React Native",
    "build app without coding",
    "AI Expo Router builder",
    "MVP generator for founders",
    "AI app builder free",
  ],
});

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Templates />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
