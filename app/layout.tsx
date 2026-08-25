import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
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
        url: "/og.jpg",
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
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
