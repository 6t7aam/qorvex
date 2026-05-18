import type { MetadataRoute } from "next";
import { QORVEX_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/pricing", "/favicon.svg", "/og-image.png"],
        disallow: ["/dashboard", "/projects", "/generate", "/billing", "/settings", "/referrals", "/admin", "/api/"],
      },
    ],
    sitemap: `${QORVEX_SITE_URL}/sitemap.xml`,
    host: QORVEX_SITE_URL,
  };
}
