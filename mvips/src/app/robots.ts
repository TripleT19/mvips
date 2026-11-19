// app/robots.ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/parent/",
          "/api/",
          "/_next/",
          "/*?*preview=*",
        ],
      },
      // Allow AI crawlers explicitly if you want GEO visibility
      { userAgent: "GPTBot",       allow: "/" },
      { userAgent: "ClaudeBot",    allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}