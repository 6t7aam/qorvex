import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },
  { path: "/login", priority: 0.4, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.7, changeFrequency: "weekly" },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

function getBaseUrl() {
  return env.APP_URL.replace(/\/+$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
