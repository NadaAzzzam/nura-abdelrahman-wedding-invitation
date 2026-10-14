import type { MetadataRoute } from "next";
import { absoluteUrl, basePath, invitation } from "./site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: invitation.title,
    short_name: `${invitation.groom} و${invitation.bride}`,
    description: invitation.description,
    id: absoluteUrl("/"),
    start_url: `${basePath || ""}/`,
    scope: `${basePath || ""}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7ecec",
    theme_color: "#a6535c",
    lang: "ar",
    dir: "rtl",
    categories: ["lifestyle"],
    icons: [
      { src: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${basePath}/icon-512-maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
