"use client";

import { Quote, Star } from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  color: string;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Indie Developer",
    initials: "SC",
    color: "#7c3aed",
    text: "I built my fitness app MVP in 2 hours with Qorvex. What would have taken me weeks of React Native setup was done before lunch.",
  },
  {
    name: "Marcus Rodriguez",
    role: "Startup Founder",
    initials: "MR",
    color: "#06b6d4",
    text: "We validated our marketplace idea in a weekend. The generated code was clean enough that our dev team could build on top of it immediately.",
  },
  {
    name: "Priya Patel",
    role: "Product Designer",
    initials: "PP",
    color: "#ec4899",
    text: "Finally a tool that speaks my language. I described the UX I wanted and Qorvex built it. The AI chat editor is genuinely magical.",
  },
  {
    name: "James Liu",
    role: "Freelance Developer",
    initials: "JL",
    color: "#f59e0b",
    text: "I use Qorvex for every client project now. Saves me 3-4 days of boilerplate setup per project. My clients love seeing a working prototype so fast.",
  },
  {
    name: "Ana Müller",
    role: "Non-technical Founder",
    initials: "AM",
    color: "#10b981",
    text: "I have zero coding experience. I described my meditation app idea and got a working prototype I could show investors. Absolutely mind-blowing.",
  },
  {
    name: "David Kim",
    role: "Mobile Developer",
    initials: "DK",
    color: "#ef4444",
    text: "The code quality surprised me. It is not just scaffolding — it is production-ready patterns with proper TypeScript types and clean component structure.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-32 -z-10 mx-auto h-64 w-1/2 rounded-full bg-violet-500/10 blur-[110px]"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            Reviews
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Loved by <span className="gradient-text">builders</span> worldwide
          </h2>
        </FadeIn>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <FadeIn key={t.name} delay={idx * 0.05}>
              <TestimonialCard testimonial={t} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="card-surface card-hover sheen group relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
      <Quote
        aria-hidden
        className="absolute right-5 top-5 h-10 w-10 text-white/[0.04] transition-all duration-500 group-hover:scale-110 group-hover:text-white/[0.08]"
      />
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400 transition-transform duration-500"
            style={{ transitionDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-text-secondary">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3">
        <div
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: testimonial.color,
            boxShadow: `0 8px 24px ${testimonial.color}55`,
          }}
        >
          {testimonial.initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">
            {testimonial.name}
          </div>
          <div className="text-xs text-text-muted">{testimonial.role}</div>
        </div>
      </div>
    </div>
  );
}
