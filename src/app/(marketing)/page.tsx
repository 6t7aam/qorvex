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
  absoluteTitle: "Qorvex — AI Mobile App Builder",
  description:
    "Create mobile apps with AI. Turn ideas into React Native and Expo apps with previews, editing, exports, and launch tools.",
  path: "/",
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
