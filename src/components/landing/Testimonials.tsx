"use client";

import { Star } from "lucide-react";
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Loved by builders worldwide
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
    <div className="glass flex h-full flex-col rounded-2xl p-6">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
          />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-text-secondary">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: testimonial.color }}
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
