import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Terms of Service · Qorvex",
  description:
    "The Terms of Service that govern your use of Qorvex — the AI mobile app builder for React Native and Expo.",
  path: "/terms",
});

const LAST_UPDATED = "May 25, 2026";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="Legal"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            Welcome to <strong className="text-white">Qorvex</strong>. These
            Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement
            between you and Qorvex (&ldquo;Qorvex&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;) and govern your access to and use of the Qorvex
            website, dashboard, AI generation engine, and related services
            (together, the &ldquo;Service&rdquo;).
          </p>
          <p className="mt-3">
            By creating an account or otherwise using the Service, you confirm
            that you have read, understood, and accepted these Terms. If you do
            not agree, you must not use the Service.
          </p>
        </>
      }
      sections={[
        {
          title: "Eligibility & account",
          body: (
            <>
              <p>
                You must be at least 16 years old (or the age of digital
                consent in your jurisdiction) to use Qorvex. By signing up you
                represent that the information you provide is accurate and
                that you will keep it up to date.
              </p>
              <p>
                You are responsible for safeguarding your credentials and for
                everything that happens under your account. Notify us
                immediately if you suspect unauthorized access.
              </p>
            </>
          ),
        },
        {
          title: "The Service",
          body: (
            <>
              <p>
                Qorvex turns your prompts and configuration into React Native
                and Expo source code, previews, and exports. The Service is
                provided on an &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; basis and may evolve over time, including
                changes to features, AI capabilities, pricing tiers, and
                integrations.
              </p>
              <p>
                We may impose usage limits (such as daily AI credits) to ensure
                fair access. Limits are described inside the dashboard and on
                the Pricing page.
              </p>
            </>
          ),
        },
        {
          title: "Acceptable use",
          body: (
            <>
              <p>You agree not to use Qorvex to:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>Generate code or content that violates any law or third-party rights.</li>
                <li>Build malware, phishing tools, surveillance software, or apps that facilitate harm.</li>
                <li>Bypass usage limits, scrape the Service, or reverse-engineer non-public parts of it.</li>
                <li>Submit personal data of others without lawful basis, including in prompts.</li>
                <li>Resell, sublicense, or white-label the Service without a written agreement.</li>
              </ul>
              <p>
                We may suspend or terminate accounts that violate these rules,
                with or without notice.
              </p>
            </>
          ),
        },
        {
          title: "User content & generated code",
          body: (
            <>
              <p>
                <strong className="text-white">Your prompts and inputs.</strong>{" "}
                You retain all rights in the prompts, names, descriptions, and
                other content you submit. You grant Qorvex a worldwide,
                royalty-free licence to process this content solely to operate
                and improve the Service.
              </p>
              <p>
                <strong className="text-white">Generated code.</strong> Subject
                to your continued compliance with these Terms, Qorvex assigns
                to you the source code and assets produced for your account.
                You are responsible for reviewing generated output before
                publishing or shipping it.
              </p>
              <p>
                <strong className="text-white">Templates &amp; engine.</strong>{" "}
                Qorvex&apos;s starter templates, prompt orchestration, brand
                assets, and the underlying generation engine remain the
                exclusive property of Qorvex.
              </p>
            </>
          ),
        },
        {
          title: "Subscriptions, credits & billing",
          body: (
            <>
              <p>
                Paid plans renew automatically each billing cycle until
                cancelled. Cancellations take effect at the end of the current
                cycle and you retain access until then. Daily AI credits reset
                at 00:00 UTC and do not roll over unless explicitly stated.
              </p>
              <p>
                Refunds are handled case-by-case and generally available within
                7 days of the original charge for first-time subscribers.
                Payment processing is handled by our payment partners (e.g.,
                Stripe); their own terms apply.
              </p>
            </>
          ),
        },
        {
          title: "Third-party services",
          body: (
            <p>
              Qorvex integrates with third-party services such as Supabase,
              Stripe, GitHub, and our AI infrastructure providers. Your use of
              those services is also governed by their respective terms and
              privacy policies. We are not responsible for the practices of
              third parties.
            </p>
          ),
        },
        {
          title: "Disclaimers",
          body: (
            <p>
              The Service and generated output are provided without warranty
              of any kind, express or implied, including merchantability,
              fitness for a particular purpose, non-infringement, or
              uninterrupted availability. AI-generated code may contain bugs,
              insecure patterns, or hallucinated APIs — you are responsible for
              review and testing before deployment.
            </p>
          ),
        },
        {
          title: "Limitation of liability",
          body: (
            <p>
              To the maximum extent permitted by law, Qorvex&apos;s total
              liability arising out of or relating to these Terms is limited to
              the greater of (i) the amounts you paid us in the 12 months
              preceding the claim or (ii) USD 100. In no event shall Qorvex be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, or loss of profits or revenue.
            </p>
          ),
        },
        {
          title: "Termination",
          body: (
            <p>
              You may stop using the Service at any time and delete your
              account from the settings page. We may suspend or terminate
              accounts that violate these Terms, present a security risk, or
              are inactive for an extended period. Sections that by their
              nature should survive termination (e.g., IP, disclaimers,
              liability) will survive.
            </p>
          ),
        },
        {
          title: "Changes to these Terms",
          body: (
            <p>
              We may update these Terms from time to time. Material changes
              will be announced through the dashboard or by email at least 14
              days before they take effect. Continued use of the Service after
              the effective date constitutes acceptance of the updated Terms.
            </p>
          ),
        },
        {
          title: "Governing law",
          body: (
            <p>
              These Terms are governed by the laws of the jurisdiction in
              which Qorvex is established, without regard to conflict-of-law
              principles. Disputes will be brought before the competent courts
              of that jurisdiction, unless mandatory consumer-protection laws
              of your country apply.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about these Terms can be sent to{" "}
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
    />
  );
}
