import { NextResponse } from "next/server";
import {
  QORVEX_BRAND_TAGLINE,
  QORVEX_DEFAULT_DESCRIPTION,
  QORVEX_SITE_NAME,
} from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const manifest = {
    name: `${QORVEX_SITE_NAME} — AI Mobile App Builder`,
    short_name: QORVEX_SITE_NAME,
    description: QORVEX_DEFAULT_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080808",
    theme_color: "#0d0d12",
    lang: "en-US",
    dir: "ltr",
    categories: ["productivity", "developer", "business"],
    id: "/",
    icons: [
      {
        src: "/favicon.svg?v=5",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg?v=5",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/apple-icon?v=5",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/og-image.png?v=5",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: QORVEX_BRAND_TAGLINE,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
