import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { basePath, invitation, shareImage, siteOrigin } from "./site";

const coupleNames = `${invitation.groom} و${invitation.bride}`;

export const viewport: Viewport = {
  themeColor: "#a6535c",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: invitation.title,
    template: `%s | ${coupleNames}`,
  },
  description: invitation.description,
  applicationName: coupleNames,
  authors: [{ name: coupleNames }],
  creator: coupleNames,
  publisher: coupleNames,
  category: "دعوة",
  keywords: [
    "عقد قران",
    invitation.groom,
    invitation.bride,
    "دعوة زفاف",
    invitation.gregorianDate,
    invitation.venue,
  ],
  alternates: {
    canonical: `${basePath}/`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    title: coupleNames,
    statusBarStyle: "default",
  },
  openGraph: {
    title: invitation.title,
    description: invitation.shareDescription,
    type: "website",
    locale: "ar_EG",
    url: `${basePath}/`,
    siteName: coupleNames,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: invitation.title,
    description: invitation.shareDescription,
    images: [shareImage.url],
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "48x48" },
      { url: `${basePath}/favicon.svg`, type: "image/svg+xml" },
      { url: `${basePath}/favicon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${basePath}/favicon-16.png`, sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
    shortcut: `${basePath}/favicon.ico`,
  },
  manifest: `${basePath}/manifest.webmanifest`,
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
        <link rel="mask-icon" href={`${basePath}/safari-pinned-tab.svg`} color="#a6535c" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
