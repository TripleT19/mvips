// app/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/lib/seo";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"),               lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: absoluteUrl("/about"),          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/academics"),      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/admissions"),     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/school-life"),    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/campus"),         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/top-achievers"),  lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/gallery"),        lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: absoluteUrl("/news"),           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: absoluteUrl("/newsletters"),    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: absoluteUrl("/policies"),       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/alumni"),         lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"),        lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
  ];

  if (!API) return staticRoutes;

  const fetchList = async (path: string): Promise<any[]> => {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [];
      const json = await res.json();
      const rows = json?.data?.data ?? json?.data ?? [];
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  };

  const [stories, events, galleries, newsletters, policies] = await Promise.all([
    fetchList("/api/stories?status=published&per_page=200"),
    fetchList("/api/events?per_page=200"),
    fetchList("/api/gallery?per_page=200"),
    fetchList("/api/newsletters?per_page=200"),
    fetchList("/api/policies"),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...stories.map((s) => ({
      url: absoluteUrl(`/news/${s.slug}`),
      lastModified: s.updated_at ? new Date(s.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: absoluteUrl(`/events/${e.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...galleries.map((g) => ({
      url: absoluteUrl(`/gallery/${g.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...newsletters.map((n) => ({
      url: absoluteUrl(`/newsletters/${n.slug}`),
      lastModified: n.published_at ? new Date(n.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...policies.map((p) => ({
      url: absoluteUrl(`/policies/${p.id}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}