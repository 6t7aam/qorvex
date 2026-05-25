import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import {
  QORVEX_BRAND_TITLE,
  QORVEX_DEFAULT_DESCRIPTION,
  QORVEX_DEFAULT_LOCALE,
  QORVEX_KEYWORDS,
  QORVEX_OG_IMAGE_PATH,
  QORVEX_SITE_NAME,
  QORVEX_SITE_URL,
  QORVEX_TWITTER_HANDLE,
  getMetadataBase,
  getOrganizationJsonLd,
  getSoftwareAppJsonLd,
  getWebsiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: QORVEX_BRAND_TITLE,
    template: "%s · Qorvex",
  },
  description: QORVEX_DEFAULT_DESCRIPTION,
  keywords: QORVEX_KEYWORDS,
  applicationName: QORVEX_SITE_NAME,
  authors: [{ name: QORVEX_SITE_NAME, url: QORVEX_SITE_URL }],
  creator: QORVEX_SITE_NAME,
  publisher: QORVEX_SITE_NAME,
  category: "technology",
  classification: "AI App Builder",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: QORVEX_SITE_URL,
    languages: {
      "en-US": QORVEX_SITE_URL,
      "x-default": QORVEX_SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: QORVEX_BRAND_TITLE,
    description: QORVEX_DEFAULT_DESCRIPTION,
    url: QORVEX_SITE_URL,
    type: "website",
    siteName: QORVEX_SITE_NAME,
    locale: QORVEX_DEFAULT_LOCALE,
    images: [
      {
        url: QORVEX_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Qorvex — AI Mobile App Builder for React Native & Expo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: QORVEX_BRAND_TITLE,
    description: QORVEX_DEFAULT_DESCRIPTION,
    site: QORVEX_TWITTER_HANDLE,
    creator: QORVEX_TWITTER_HANDLE,
    images: [
      {
        url: QORVEX_OG_IMAGE_PATH,
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
  icons: {
    icon: [
      { url: "/favicon.svg?v=5", type: "image/svg+xml", sizes: "any" },
      { url: "/icon.svg?v=5", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: [{ url: "/favicon.svg?v=5", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon?v=5", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg?v=5",
        color: "#7c3aed",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: QORVEX_SITE_NAME,
  },
  other: {
    "msapplication-TileColor": "#0d0d12",
    "msapplication-TileImage": "/apple-icon?v=5",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d0d12" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d12" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    getOrganizationJsonLd(),
    getWebsiteJsonLd(),
    getSoftwareAppJsonLd(),
  ];

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {jsonLd.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} dark min-h-screen bg-background-primary text-text-primary antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
