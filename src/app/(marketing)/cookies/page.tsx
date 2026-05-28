import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Cookies Policy · Qorvex",
  description:
    "How Qorvex uses cookies and browser storage to keep you signed in, remember your preferences, and operate the AI mobile app builder.",
  path: "/cookies",
});

const LAST_UPDATED = "May 25, 2026";

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies Policy"
      subtitle="Cookies"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            This Cookies Policy explains how{" "}
            <strong className="text-white">Qorvex</strong> uses cookies and
            similar browser storage technologies. It complements our{" "}
            <a
              href="/privacy"
              className="text-violet-300 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>{" "}
            and applies to the Qorvex website, dashboard, and AI generation
            tools.
          </p>
          <p className="mt-3">
            We use the smallest possible set of cookies — only what is needed
            to keep you signed in, remember your preferences, and ensure
            security. We do not use third-party advertising or cross-site
            tracking cookies.
          </p>
        </>
      }
      sections={[
        {
          title: "What is a cookie?",
          body: (
            <p>
              A cookie is a small text file stored by your browser on your
              device. It allows a website to remember information about your
              visit — such as your sign-in state or preferred language — so
              the next page works smoothly. We also use related technologies
              such as <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-violet-200">localStorage</code> and{" "}
              <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-violet-200">sessionStorage</code>; for clarity, this
              policy refers to all of them collectively as &ldquo;cookies&rdquo;.
            </p>
          ),
        },
        {
          title: "Categories of cookies we use",
          body: (
            <>
              <p>
                <strong className="text-white">Strictly necessary.</strong>{" "}
                Required for the Service to function — for example,
                authentication tokens, session identifiers, CSRF protection,
                and load-balancing cookies. These cannot be disabled while
                using the dashboard.
              </p>
              <p>
                <strong className="text-white">Preferences.</strong> Remember
                non-critical choices such as your selected language, sidebar
                state, or last opened project tab. Disabling these will not
                break the Service, but it may reset preferences on each
                visit.
              </p>
              <p>
                <strong className="text-white">Security &amp; abuse
                prevention.</strong> Help us detect suspicious activity (e.g.,
                duplicate accounts, credential stuffing) and rate-limit
                abusive traffic. These cookies do not identify you to anyone
                outside Qorvex.
              </p>
              <p>
                <strong className="text-white">Performance.</strong>{" "}
                Aggregate, anonymous metrics about page load times and error
                rates so we can spot and fix regressions quickly.
              </p>
            </>
          ),
        },
        {
          title: "Third-party cookies",
          body: (
            <>
              <p>
                A small number of cookies are set by third-party services we
                rely on:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong className="text-white">Supabase</strong> — authentication and session management (e.g., <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-violet-200">sb-access-token</code>).</li>
                <li><strong className="text-white">Vercel</strong> — infrastructure-level cookies for routing and edge caching.</li>
              </ul>
              <p>
                Each provider operates under its own privacy and cookies
                policy. We do not allow third-party advertising networks to
                set cookies on Qorvex.
              </p>
            </>
          ),
        },
        {
          title: "How long cookies are kept",
          body: (
            <p>
              Session cookies are deleted when you close your browser.
              Persistent cookies (such as authentication tokens or
              preferences) stay on your device for the duration shown by your
              browser&apos;s cookie inspector, typically between 7 days and 1
              year. The exact duration depends on the cookie&apos;s purpose
              and the issuing provider.
            </p>
          ),
        },
        {
          title: "Managing cookies",
          body: (
            <>
              <p>
                You can review and delete cookies at any time through your
                browser settings. Most browsers also let you block cookies
                from specific sites — note that blocking strictly-necessary
                cookies will prevent you from signing in to Qorvex.
              </p>
              <p>
                Helpful guides for the most common browsers:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-violet-300 underline-offset-2 hover:underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-violet-300 underline-offset-2 hover:underline"
                  >
                    Apple Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-violet-300 underline-offset-2 hover:underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-violet-300 underline-offset-2 hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Do Not Track signals",
          body: (
            <p>
              Because Qorvex does not use cross-site advertising or behavioural
              tracking, &ldquo;Do Not Track&rdquo; browser signals do not
              change our cookie behaviour. We always treat your data the way
              this policy describes.
            </p>
          ),
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              We may update this Cookies Policy from time to time to reflect
              changes in how we operate or in applicable law. The &ldquo;Last
              updated&rdquo; date at the top of this page indicates the most
              recent revision.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about cookies on Qorvex? Email{" "}
              <a
                href="mailto:privacy@qorvex.mov"
                className="text-violet-300 underline-offset-2 hover:underline"
              >
                privacy@qorvex.mov
              </a>
              .
            </p>
          ),
        },
      ]}
      contactEmail="privacy@qorvex.mov"
    />
  );
}
