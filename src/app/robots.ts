import type { MetadataRoute } from "next";
import { QORVEX_SITE_URL } from "@/lib/seo";

const ALLOWED_PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/favicon.svg",
  "/icon.svg",
  "/apple-icon",
  "/og-image.png",
  "/qorvex-logo.svg",
  "/manifest.webmanifest",
];

const PRIVATE_PATHS = [
  "/dashboard",
  "/projects",
  "/generate",
  "/billing",
  "/settings",
  "/referrals",
  "/admin",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOWED_PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
      // Explicitly invite the major crawlers (Googlebot, Bingbot, Twitterbot,
      // Slackbot, LinkedInBot, DuckDuckBot, ChatGPT-User, GPTBot, etc.) so
      // social previews and rich-result indexing pick up faster.
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Bingbot", "DuckDuckBot"],
        allow: ALLOWED_PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: ["Twitterbot", "facebookexternalhit", "LinkedInBot", "Slackbot", "Discordbot"],
        allow: ["/", "/pricing", "/login", "/signup", "/og-image.png", "/favicon.svg", "/qorvex-logo.svg"],
      },
    ],
    sitemap: `${QORVEX_SITE_URL}/sitemap.xml`,
    host: QORVEX_SITE_URL,
  };
}
