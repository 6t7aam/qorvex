import type { Metadata } from "next";

export const QORVEX_SITE_URL = "https://www.qorvex.mov";
export const QORVEX_SITE_NAME = "Qorvex";
export const QORVEX_BRAND_TITLE =
  "Qorvex — AI Mobile App Builder for React Native & Expo";
export const QORVEX_DEFAULT_DESCRIPTION =
  "Build production-ready iOS & Android apps with AI. Qorvex turns a sentence into a complete React Native + Expo app — preview, edit by chat, export to GitHub. Free plan, no card required.";
export const QORVEX_SHORT_DESCRIPTION =
  "Turn one sentence into a full React Native + Expo app. AI generation, live mobile preview, chat editor, GitHub export.";
export const QORVEX_BRAND_TAGLINE =
  "AI mobile app builder that turns ideas into React Native and Expo apps.";
export const QORVEX_OG_IMAGE_PATH = "/og-image.png?v=6";
export const QORVEX_TWITTER_HANDLE = "@qorvex";
export const QORVEX_DEFAULT_LOCALE = "en_US";

/**
 * Canonical primary keyword set covering the highest-intent searches we want
 * to rank for. Kept tight and on-topic so search engines treat the list as
 * signal rather than spam.
 */
export const QORVEX_KEYWORDS: string[] = [
  "AI mobile app builder",
  "AI app generator",
  "React Native AI",
  "Expo app builder",
  "build mobile app with AI",
  "AI no-code app builder",
  "text to mobile app",
  "iOS app generator",
  "Android app generator",
  "no-code React Native",
  "AI app maker",
  "prompt to app",
  "generate React Native code with AI",
  "AI Expo Router",
  "Supabase AI app generator",
  "ship mobile MVP fast",
  "AI mobile app prototype",
  "TypeScript React Native generator",
  "GitHub export mobile app",
  "Qorvex",
];

export function getMetadataBase() {
  return new URL(QORVEX_SITE_URL);
}

export function getCanonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, QORVEX_SITE_URL).toString();
}

interface CreatePageMetadataInput {
  /** Title segment that gets templated as `${title} | Qorvex`. */
  title?: string;
  /** Fully-qualified title that bypasses the template. */
  absoluteTitle?: string;
  description: string;
  path: string;
  /** When false, the page is excluded from indexing. */
  index?: boolean;
  /** Extra page-specific keywords merged on top of the brand defaults. */
  keywords?: string[];
  /** Custom OG image override. */
  ogImage?: string;
}

export function createPageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  index = true,
  keywords = [],
  ogImage = QORVEX_OG_IMAGE_PATH,
}: CreatePageMetadataInput): Metadata {
  const canonical = getCanonicalUrl(path);
  const resolvedTitle = absoluteTitle ?? title ?? QORVEX_BRAND_TITLE;
  const mergedKeywords = Array.from(
    new Set([...QORVEX_KEYWORDS, ...keywords]),
  );

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    keywords: mergedKeywords,
    applicationName: QORVEX_SITE_NAME,
    authors: [{ name: QORVEX_SITE_NAME, url: QORVEX_SITE_URL }],
    creator: QORVEX_SITE_NAME,
    publisher: QORVEX_SITE_NAME,
    category: "technology",
    alternates: {
      canonical,
      languages: {
        "en-US": canonical,
        "x-default": canonical,
      },
    },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: QORVEX_SITE_NAME,
      type: "website",
      locale: QORVEX_DEFAULT_LOCALE,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Qorvex — AI Mobile App Builder for React Native & Expo",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      site: QORVEX_TWITTER_HANDLE,
      creator: QORVEX_TWITTER_HANDLE,
      images: [
        {
          url: ogImage,
          alt: "Qorvex — AI Mobile App Builder for React Native & Expo",
          width: 1200,
          height: 630,
        },
      ],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export function createPrivatePageMetadata(
  input: Omit<CreatePageMetadataInput, "index">,
): Metadata {
  return createPageMetadata({
    ...input,
    index: false,
  });
}

/**
 * JSON-LD payloads — emitted from the root layout so Google can render rich
 * snippets (brand name, sitelinks search box, sameAs, sameAs).
 */
export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: QORVEX_SITE_NAME,
    legalName: "Qorvex",
    url: QORVEX_SITE_URL,
    logo: `${QORVEX_SITE_URL}/qorvex-logo.svg`,
    description: QORVEX_DEFAULT_DESCRIPTION,
    foundingDate: "2025",
    slogan: QORVEX_BRAND_TAGLINE,
    sameAs: [
      "https://x.com/qorvex",
      "https://github.com/qorvex",
      "https://www.linkedin.com/company/qorvex",
    ],
  };
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: QORVEX_SITE_NAME,
    url: QORVEX_SITE_URL,
    description: QORVEX_DEFAULT_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: QORVEX_SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${QORVEX_SITE_URL}/qorvex-logo.svg`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${QORVEX_SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function getSoftwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: QORVEX_SITE_NAME,
    operatingSystem: "Web, iOS, Android",
    applicationCategory: "DeveloperApplication",
    description: QORVEX_DEFAULT_DESCRIPTION,
    url: QORVEX_SITE_URL,
    image: `${QORVEX_SITE_URL}${QORVEX_OG_IMAGE_PATH}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "49",
      offerCount: 3,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2400",
    },
    creator: {
      "@type": "Organization",
      name: QORVEX_SITE_NAME,
      url: QORVEX_SITE_URL,
    },
  };
}
