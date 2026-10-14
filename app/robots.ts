import type { MetadataRoute } from "next";
import { absoluteUrl, basePath } from "./site";

export default function robots(): MetadataRoute.Robots {
  const root = basePath || "";

  return {
    rules: {
      userAgent: "*",
      allow: root ? `${root}/` : "/",
      disallow: [`${root}/messages`, `${root}/messages/`],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
