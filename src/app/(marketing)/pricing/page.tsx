import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata: Metadata = {
  title: "Pricing — Qorvex",
  description:
    "Simple transparent pricing. Free plan with daily AI credits, Pro at $9.99/month, and Max at $29.99/month for larger daily AI capacity.",
};

interface ComparisonRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  max: string | boolean;
}

const COMPARISON: ComparisonRow[] = [
  { label: "Daily AI credits", free: "3,500", pro: "18,000", max: "90,000" },
  { label: "Basic templates", free: true, pro: true, max: true },
  { label: "All premium templates", free: false, pro: true, max: true },
  { label: "Mobile preview", free: true, pro: true, max: true },
  { label: "Export to Expo", free: true, pro: true, max: true },
  { label: "AI chat editor", free: false, pro: true, max: true },
  { label: "GitHub integration", free: false, pro: true, max: true },
  { label: "Custom themes", free: false, pro: true, max: true },
  { label: "QR code preview", free: false, pro: true, max: true },
  { label: "Priority support", free: false, pro: true, max: true },
  { label: "Early access features", free: false, pro: false, max: true },
  { label: "Dedicated support", free: false, pro: false, max: true },
  { label: "Custom domain deployment", free: false, pro: false, max: true },
  { label: "Team collaboration (soon)", free: false, pro: false, max: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-cyan-400" />
    ) : (
      <X className="mx-auto h-4 w-4 text-text-muted" />
    );
  }
  return <span className="text-sm font-medium text-white">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <section className="relative pt-20 sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Pricing that{" "}
              <span className="gradient-text">scales with you</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
              Pick the plan that fits where you are. Upgrade or downgrade
              anytime — your generated apps are always yours to keep.
            </p>
          </FadeIn>
        </div>
      </section>

      <Pricing showHeader={false} />

      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Compare plans in detail
            </h2>
            <p className="mt-3 text-base text-text-secondary">
              Every feature, side by side.
            </p>
          </FadeIn>

          <FadeIn className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[680px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-white/5">
              <thead>
                <tr className="bg-background-secondary/60">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-violet-300">
                    Pro
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={
                      idx % 2 === 0
                        ? "bg-transparent"
                        : "bg-white/[0.015]"
                    }
                  >
                    <td className="border-t border-white/5 px-6 py-3.5 text-sm text-white">
                      {row.label}
                    </td>
                    <td className="border-t border-white/5 px-6 py-3.5 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="border-t border-white/5 px-6 py-3.5 text-center">
                      <Cell value={row.pro} />
                    </td>
                    <td className="border-t border-white/5 px-6 py-3.5 text-center">
                      <Cell value={row.max} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeIn>
        </div>
      </section>

      <FAQ />
    </>
  );
}
