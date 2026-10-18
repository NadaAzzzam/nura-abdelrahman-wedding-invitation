const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export { basePath, siteOrigin };

export const invitation = {
  groom: "عبدالرحمن",
  bride: "نورا",
  title: "دعوة عقد قران عبدالرحمن ونورا | 6 نوفمبر 2026",
  description:
    "نتشرف بدعوتكم لحضور عقد قران عبدالرحمن ونورا يوم الجمعة 6 نوفمبر 2026، الموافق 26 جمادى الأولى 1448 هـ، بعد صلاة العصر، في مسجد عبدالله بن مسعود بعين شمس، القاهرة.",
  shareDescription:
    "شاركونا فرحتنا يوم الجمعة 6 نوفمبر 2026، بعد صلاة العصر، في مسجد عبدالله بن مسعود بعين شمس.",
  dateTime: "2026-11-06T18:00:00+02:00",
  day: "الجمعة",
  gregorianDate: "6 نوفمبر 2026",
  hijriDate: "26 جمادى الأولى 1448 هـ",
  time: "بعد صلاة العصر",
  venue: "مسجد عبدالله بن مسعود",
  area: "عين شمس، القاهرة",
  coordinates: [30.130129, 31.356288] as const,
};

export const searchKeywords = [
  "دعوة عقد قران",
  "عقد قران",
  "عبدالرحمن ونورا",
  "نورا وعبدالرحمن",
  invitation.groom,
  invitation.bride,
  "دعوة زفاف",
  invitation.gregorianDate,
  invitation.hijriDate,
  invitation.venue,
  "مسجد عبدالله بن مسعود عين شمس",
  "عين شمس",
  "القاهرة",
];

export const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=30.130129,31.356288";

export const shareImage = {
  url: `${basePath}/og.jpg`,
  width: 864,
  height: 1536,
  alt: "دعوة عقد قران عبدالرحمن ونورا — 6 نوفمبر 2026",
  type: "image/jpeg" as const,
};

export function absoluteUrl(pathname = "/") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteOrigin}${basePath}${path}`;
}

const pageUrl = absoluteUrl("/");
const shareImageUrl = absoluteUrl("/og.jpg");
const coupleNames = `${invitation.groom} و${invitation.bride}`;

export const invitationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${pageUrl}#website`,
      url: pageUrl,
      name: coupleNames,
      description: invitation.description,
      inLanguage: "ar-EG",
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: invitation.title,
      description: invitation.description,
      inLanguage: "ar-EG",
      isPartOf: { "@id": `${pageUrl}#website` },
      about: { "@id": `${pageUrl}#event` },
      primaryImageOfPage: { "@id": `${pageUrl}#share-image` },
      datePublished: "2026-10-14",
      dateModified: "2026-10-15",
    },
    {
      "@type": "ImageObject",
      "@id": `${pageUrl}#share-image`,
      url: shareImageUrl,
      contentUrl: shareImageUrl,
      width: shareImage.width,
      height: shareImage.height,
      caption: shareImage.alt,
      inLanguage: "ar",
    },
    {
      "@type": "Event",
      "@id": `${pageUrl}#event`,
      name: "عقد قران عبدالرحمن ونورا",
      description: invitation.description,
      startDate: invitation.dateTime,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      inLanguage: "ar-EG",
      isAccessibleForFree: true,
      image: [shareImageUrl, absoluteUrl("/watercolor-couple.png")],
      url: pageUrl,
      keywords: searchKeywords.join(", "),
      location: {
        "@type": "Place",
        name: invitation.venue,
        hasMap: mapsUrl,
        address: {
          "@type": "PostalAddress",
          streetAddress: "عين شمس الشرقية، قسم عين شمس",
          addressLocality: "عين شمس",
          addressRegion: "القاهرة",
          addressCountry: "EG",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: invitation.coordinates[0],
          longitude: invitation.coordinates[1],
        },
      },
      organizer: [
        { "@type": "Person", name: invitation.groom },
        { "@type": "Person", name: invitation.bride },
      ],
    },
  ],
};
