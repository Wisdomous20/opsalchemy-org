import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-19");
  return [
    {
      url: "https://opsalchemy.org",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://opsalchemy.org/privacy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
