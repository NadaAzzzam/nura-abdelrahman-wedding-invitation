import type { MetadataRoute } from "next";
import { absoluteUrl } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date("2026-10-14"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
