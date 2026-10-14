import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const shareImage = `${basePath}/og.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "دعوة عقد قران عبدالرحمن ونورا",
  description:
    "نتشرف بدعوتكم لحضور عقد قران عبدالرحمن ونورا يوم 6 نوفمبر 2026.",
  openGraph: {
    title: "دعوة عقد قران عبدالرحمن ونورا",
    description: "شاركونا فرحتنا يوم 6 نوفمبر 2026",
    type: "website",
    locale: "ar_EG",
    images: [
      {
        url: shareImage,
        width: 1024,
        height: 1536,
        alt: "دعوة عبدالرحمن ونورا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "دعوة عقد قران عبدالرحمن ونورا",
    description: "شاركونا فرحتنا يوم 6 نوفمبر 2026",
    images: [shareImage],
  },
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const couplePhoto = {
    "--couple-photo": `url("${basePath}/watercolor-couple.png")`,
  } as CSSProperties;

  return (
    <html lang="ar" dir="rtl" style={couplePhoto}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Great+Vibes&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
