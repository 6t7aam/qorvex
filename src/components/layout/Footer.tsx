import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Templates", href: "/#templates" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "mailto:hello@qorvex.mov", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-background-primary text-text-secondary">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-12 mx-auto h-24 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(124,58,237,0.25),rgba(34,211,238,0.18),transparent)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.5),rgba(34,211,238,0.45),transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-3">
            <Logo href="/" size="md" />
            <p className="text-sm text-text-muted">
              AI mobile app builder for React Native and Expo.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="link-underline text-sm text-text-secondary transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="link-underline text-sm text-text-secondary transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            © 2026 Qorvex. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-text-muted">
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Qorvex on X"
              className="group relative rounded-md p-1.5 transition hover:bg-white/5 hover:text-white"
            >
              <span className="absolute inset-0 rounded-md bg-violet-500/0 transition-all duration-300 group-hover:bg-violet-500/15" />
              <XIcon className="relative h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Qorvex on GitHub"
              className="group relative rounded-md p-1.5 transition hover:bg-white/5 hover:text-white"
            >
              <span className="absolute inset-0 rounded-md bg-cyan-500/0 transition-all duration-300 group-hover:bg-cyan-500/15" />
              <GithubIcon className="relative h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Qorvex on LinkedIn"
              className="group relative rounded-md p-1.5 transition hover:bg-white/5 hover:text-white"
            >
              <span className="absolute inset-0 rounded-md bg-violet-500/0 transition-all duration-300 group-hover:bg-violet-500/15" />
              <LinkedinIcon className="relative h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2H21l-6.541 7.474L22.5 22h-6.828l-4.79-6.262L5.4 22H2.642l7.001-8.003L1.5 2h6.998l4.333 5.726L18.244 2Zm-1.196 18h1.83L7.05 4H5.083l11.965 16Z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1-.02-1.96-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.95.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.12 0 .3.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.78A1.77 1.77 0 0 0 0 1.75v20.5C0 23.21.79 24 1.78 24h20.44A1.77 1.77 0 0 0 24 22.25V1.75A1.77 1.77 0 0 0 22.22 0Z" />
    </svg>
  );
}
