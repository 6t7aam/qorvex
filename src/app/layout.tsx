import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import {
  QORVEX_DEFAULT_DESCRIPTION,
  QORVEX_OG_IMAGE_PATH,
  QORVEX_SITE_NAME,
  QORVEX_SITE_URL,
  getMetadataBase,
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
    default: QORVEX_SITE_NAME,
    template: "%s | Qorvex",
  },
  description: QORVEX_DEFAULT_DESCRIPTION,
  keywords: [
    "mobile app builder",
    "AI app generator",
    "React Native",
    "no-code",
    "Expo",
  ],
  alternates: {
    canonical: QORVEX_SITE_URL,
  },
  openGraph: {
    title: QORVEX_SITE_NAME,
    description: QORVEX_DEFAULT_DESCRIPTION,
    url: QORVEX_SITE_URL,
    type: "website",
    siteName: QORVEX_SITE_NAME,
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
    title: QORVEX_SITE_NAME,
    description: QORVEX_DEFAULT_DESCRIPTION,
    images: [QORVEX_OG_IMAGE_PATH],
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=4", type: "image/svg+xml", sizes: "any" },
      { url: "/icon.svg?v=4", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: [{ url: "/favicon.svg?v=4", type: "image/svg+xml" }],
    apple: [
      { url: "/apple-icon?v=4", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} dark min-h-screen bg-background-primary text-text-primary antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
