const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export { basePath, siteOrigin };

export const invitation = {
  groom: "عبدالرحمن",
  bride: "نورا",
  title: "دعوة عقد قران عبدالرحمن ونورا",
  description:
    "نتشرف بدعوتكم لحضور عقد قران عبدالرحمن ونورا يوم الجمعة 6 نوفمبر 2026، بعد صلاة العشاء، في مسجد عبدالله بن مسعود بعين شمس.",
  shareDescription: "شاركونا فرحتنا يوم الجمعة 6 نوفمبر 2026، بعد صلاة العشاء.",
  dateTime: "2026-11-06T18:00:00+02:00",
  day: "الجمعة",
  gregorianDate: "6 نوفمبر 2026",
  hijriDate: "26 جمادى الأولى 1448 هـ",
  time: "بعد صلاة العشاء",
  venue: "مسجد عبدالله بن مسعود",
  area: "عين شمس، القاهرة",
  coordinates: [30.130129, 31.356288] as const,
};

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

export const invitationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: invitation.title,
  description: invitation.description,
  startDate: invitation.dateTime,
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  inLanguage: "ar",
  isAccessibleForFree: true,
  image: [absoluteUrl("/og.jpg")],
  url: absoluteUrl("/"),
  location: {
    "@type": "Place",
    name: invitation.venue,
    address: {
      "@type": "PostalAddress",
      streetAddress: "49J4+3G3، عين شمس الشرقية، قسم عين شمس",
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
};
