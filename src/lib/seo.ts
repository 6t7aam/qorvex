import type { Metadata } from "next";

export const QORVEX_SITE_URL = "https://www.qorvex.mov";
export const QORVEX_SITE_NAME = "Qorvex";
export const QORVEX_DEFAULT_DESCRIPTION =
  "Qorvex is an AI-powered mobile app builder that helps you create, preview, edit, and export React Native and Expo apps from natural language prompts.";
export const QORVEX_BRAND_TAGLINE =
  "AI mobile app builder that turns ideas into React Native and Expo apps.";
export const QORVEX_OG_IMAGE_PATH = "/og-image.png";

export function getMetadataBase() {
  return new URL(QORVEX_SITE_URL);
}

export function getCanonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, QORVEX_SITE_URL).toString();
}

interface CreatePageMetadataInput {
  title?: string;
  absoluteTitle?: string;
  description: string;
  path: string;
  index?: boolean;
}

export function createPageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  index = true,
}: CreatePageMetadataInput): Metadata {
  const canonical = getCanonicalUrl(path);
  const resolvedTitle = absoluteTitle ?? title ?? QORVEX_SITE_NAME;

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index,
      follow: index,
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: QORVEX_SITE_NAME,
      type: "website",
      images: [
        {
          url: QORVEX_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: "Qorvex — AI Mobile App Builder",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [QORVEX_OG_IMAGE_PATH],
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
