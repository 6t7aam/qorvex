import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  title: "Qorvex — Turn Ideas Into Mobile Apps",
  description:
    "Generate production-ready React Native apps with AI in seconds. No coding required.",
  keywords: [
    "mobile app builder",
    "AI app generator",
    "React Native",
    "no-code",
    "Expo",
  ],
  openGraph: {
    title: "Qorvex — Turn Ideas Into Mobile Apps",
    description:
      "Generate production-ready React Native apps with AI in seconds. No coding required.",
    type: "website",
    siteName: "Qorvex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qorvex — Turn Ideas Into Mobile Apps",
    description:
      "Generate production-ready React Native apps with AI in seconds. No coding required.",
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
        className={`${inter.variable} ${jetbrainsMono.variable} dark antialiased min-h-screen bg-background-primary text-text-primary`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
