import type { MetadataRoute } from "next";
import { absoluteUrl } from "./site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date("2026-10-15"),
      changeFrequency: "weekly",
      priority: 1,
      images: [absoluteUrl("/og.jpg"), absoluteUrl("/watercolor-couple.png")],
    },
  ];
}
