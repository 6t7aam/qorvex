import type { ReactNode } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/shared/FadeIn";

interface LegalSection {
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
  contactEmail?: string;
}

export function LegalPage({
  title,
  subtitle,
  lastUpdated,
  intro,
  sections,
  contactEmail = "legal@qorvex.mov",
}: LegalPageProps) {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[680px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-40" />

      <section className="relative pt-20 sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
              <span className="h-1 w-1 rounded-full bg-violet-400 animate-pulse" />
              {subtitle}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-text-muted">
              Last updated: {lastUpdated}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
          {/* Sidebar TOC */}
          <FadeIn className="lg:sticky lg:top-24 lg:self-start">
            <nav
              aria-label="Section navigation"
              className="card-surface rounded-2xl p-4"
            >
              <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                On this page
              </div>
              <ul className="space-y-1">
                {sections.map((section, idx) => (
                  <li key={section.title}>
                    <a
                      href={`#section-${idx + 1}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-secondary transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <span className="text-text-muted tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="line-clamp-1">{section.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </FadeIn>

          {/* Body */}
          <FadeIn>
            <article className="card-surface rounded-2xl p-6 sm:p-10">
              <div className="text-base leading-relaxed text-text-secondary">
                {intro}
              </div>

              <div className="mt-10 space-y-10">
                {sections.map((section, idx) => (
                  <section
                    key={section.title}
                    id={`section-${idx + 1}`}
                    className="scroll-mt-24"
                  >
                    <h2 className="flex items-baseline gap-3 text-xl font-semibold text-white">
                      <span className="gradient-text text-sm font-bold tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {section.title}
                    </h2>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
                      {section.body}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-12 border-t border-white/5 pt-6 text-xs text-text-muted">
                Questions? Reach us at{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-violet-300 underline-offset-2 hover:underline"
                >
                  {contactEmail}
                </a>
                . You can also review our{" "}
                <Link
                  href="/terms"
                  className="text-violet-300 underline-offset-2 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-violet-300 underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </div>
            </article>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
