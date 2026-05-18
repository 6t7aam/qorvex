import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Templates } from "@/components/landing/Templates";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

export const metadata: Metadata = {
  title: "Qorvex — Turn Ideas Into Mobile Apps with AI",
  description:
    "Generate production-ready React Native apps from plain English descriptions. Powered by Claude AI. Start free, no coding required.",
  keywords: [
    "mobile app builder",
    "AI app generator",
    "React Native generator",
    "no-code mobile",
    "Expo app builder",
  ],
  openGraph: {
    title: "Qorvex — Turn Ideas Into Mobile Apps with AI",
    description:
      "Generate production-ready React Native apps from plain English descriptions. Powered by Claude AI.",
    type: "website",
    siteName: "Qorvex",
  },
};

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
