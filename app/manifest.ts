import type { MetadataRoute } from "next";
import { absoluteUrl, basePath, invitation } from "./site";

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
    background_color: "#f7f1e8",
    theme_color: "#f7f1e8",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${basePath}/icon-512-maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
