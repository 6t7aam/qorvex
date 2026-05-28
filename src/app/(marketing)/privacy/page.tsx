import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Privacy Policy · Qorvex",
  description:
    "How Qorvex collects, uses, stores, and protects your data when you use our AI mobile app builder for React Native and Expo.",
  path: "/privacy",
});

const LAST_UPDATED = "May 25, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="Your data"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            This Privacy Policy explains how{" "}
            <strong className="text-white">Qorvex</strong> (&ldquo;Qorvex&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects
            your information when you visit our website, create an account, or
            generate apps using our AI engine.
          </p>
          <p className="mt-3">
            We aim to collect only what we need to deliver and improve the
            Service. We never sell your data, and we never use the contents of
            your prompts or generated code to train third-party AI models on
            your behalf.
          </p>
        </>
      }
      sections={[
        {
          title: "Information we collect",
          body: (
            <>
              <p>
                <strong className="text-white">Account information.</strong>{" "}
                When you sign up, we collect your email address, full name (if
                provided), authentication identifiers, and — for paid plans —
                payment details (crypto transactions via NOWPayments, or the
                bank-transfer screenshot you upload for manual card
                verification).
              </p>
              <p>
                <strong className="text-white">Content you submit.</strong> The
                prompts, project names, descriptions, colours, templates, and
                features you configure, along with any chat messages you send
                to the AI editor.
              </p>
              <p>
                <strong className="text-white">Generated output.</strong> The
                React Native / Expo source files, version history, and project
                metadata produced by the Service.
              </p>
              <p>
                <strong className="text-white">Usage data.</strong> Pages
                visited, device and browser information, IP address (hashed for
                abuse detection), AI credit consumption, and error logs.
              </p>
              <p>
                <strong className="text-white">Integration data.</strong> If
                you connect GitHub, we store the OAuth token and the
                repositories you authorise us to publish to.
              </p>
            </>
          ),
        },
        {
          title: "How we use your information",
          body: (
            <ul className="ml-5 list-disc space-y-1">
              <li>To operate the Service: authenticate you, generate code, store and version your projects.</li>
              <li>To enforce fair usage and detect abuse (e.g., duplicate accounts, runaway credit consumption).</li>
              <li>To process payments, manage subscriptions, and send transactional emails (receipts, password resets).</li>
              <li>To improve product quality and reliability — error monitoring, feature analytics, performance.</li>
              <li>To send occasional product updates and tips. You can opt out at any time.</li>
              <li>To comply with legal obligations and respond to lawful requests.</li>
            </ul>
          ),
        },
        {
          title: "Third-party processors",
          body: (
            <>
              <p>
                We share data with carefully selected providers strictly to
                operate the Service. Each is bound by data-processing
                agreements.
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong className="text-white">Supabase</strong> — authentication and primary database for accounts, projects, and credits.</li>
                <li><strong className="text-white">NOWPayments</strong> — crypto payment processing for subscriptions.</li>
                <li><strong className="text-white">Vercel</strong> — application hosting, edge functions, and CDN delivery.</li>
                <li><strong className="text-white">AI infrastructure providers</strong> — to perform code generation. Prompts are processed in transit and not used to train third-party foundation models on your behalf.</li>
                <li><strong className="text-white">GitHub</strong> — only when you explicitly connect a repository for export.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Cookies & local storage",
          body: (
            <p>
              We use a minimal set of cookies and browser storage entries
              required for authentication, session management, and remembering
              your preferences (such as theme or selected language). We do not
              use cross-site advertising cookies. You can clear cookies at any
              time through your browser settings; doing so will log you out.
            </p>
          ),
        },
        {
          title: "Data retention",
          body: (
            <>
              <p>
                We retain your account data for as long as your account is
                active. When you delete your account, we delete or anonymise
                your personal data within 30 days, except where retention is
                required by law (e.g., for invoicing) or for legitimate
                security purposes (e.g., abuse logs).
              </p>
              <p>
                Project files and chat history can be deleted at any time from
                the project view.
              </p>
            </>
          ),
        },
        {
          title: "Your rights",
          body: (
            <>
              <p>
                Depending on your jurisdiction (GDPR, UK GDPR, CCPA, etc.), you
                have rights to:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Export your data in a portable format.</li>
                <li>Object to or restrict certain processing activities.</li>
                <li>Withdraw consent for optional processing at any time.</li>
              </ul>
              <p>
                To exercise these rights, email{" "}
                <a
                  href="mailto:privacy@qorvex.mov"
                  className="text-violet-300 underline-offset-2 hover:underline"
                >
                  privacy@qorvex.mov
                </a>
                . We will respond within 30 days.
              </p>
            </>
          ),
        },
        {
          title: "Security",
          body: (
            <p>
              We apply industry-standard safeguards: encryption in transit
              (TLS), encryption at rest for sensitive fields, scoped access
              controls, audit logging, and regular dependency updates. No
              system is perfectly secure — if you discover a vulnerability,
              please report it responsibly to{" "}
              <a
                href="mailto:security@qorvex.mov"
                className="text-violet-300 underline-offset-2 hover:underline"
              >
                security@qorvex.mov
              </a>
              .
            </p>
          ),
        },
        {
          title: "International transfers",
          body: (
            <p>
              Qorvex&apos;s infrastructure may process data in regions outside
              your own (typically the EU and the United States). Where
              required, we rely on Standard Contractual Clauses or equivalent
              safeguards to protect data during international transfers.
            </p>
          ),
        },
        {
          title: "Children",
          body: (
            <p>
              Qorvex is not directed at children under 16. We do not knowingly
              collect personal data from anyone in this age group. If you
              believe a child has provided us with personal data, contact us
              and we will delete it.
            </p>
          ),
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be announced through the dashboard or by email
              before they take effect. The &ldquo;Last updated&rdquo; date at
              the top reflects the most recent revision.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Privacy questions or requests can be sent to{" "}
              <a
                href="mailto:privacy@qorvex.mov"
                className="text-violet-300 underline-offset-2 hover:underline"
              >
                privacy@qorvex.mov
              </a>
              . For general legal enquiries, use{" "}
              <a
                href="mailto:legal@qorvex.mov"
                className="text-violet-300 underline-offset-2 hover:underline"
              >
                legal@qorvex.mov
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
