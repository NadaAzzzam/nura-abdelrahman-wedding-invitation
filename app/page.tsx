"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { invitationJsonLd } from "./site";

const INVITATION = {
  groom: "عبدالرحمن",
  bride: "نورا",
  dateTime: "2026-11-06T18:00:00+02:00",
  day: "الجمعة",
  gregorianDate: "6 نوفمبر 2026",
  hijriDate: "26 جمادى الأولى 1448 هـ",
  time: "الساعة 6:00 مساءً",
  venue: "مسجد الشهيد حمزة بن عبد المطلب",
  coordinates: [30.0444, 31.2357] as [number, number],
  mapSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B3%D8%AC%D8%AF+%D8%A7%D9%84%D8%B4%D9%87%D9%8A%D8%AF+%D8%AD%D9%85%D8%B2%D8%A9+%D8%A8%D9%86+%D8%B9%D8%A8%D8%AF+%D8%A7%D9%84%D9%85%D8%B7%D9%84%D8%A8",
};

const VOCAL_TRACK_ID = "qxjRGJezZkQ";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const wishesEndpoint =
  process.env.NEXT_PUBLIC_WISHES_ENDPOINT ||
  "https://nura-wedding-wishes.bonto.run/api/wishes";

type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getRemainingTime(): RemainingTime {
  const distance = Math.max(
    0,
    new Date(INVITATION.dateTime).getTime() - Date.now(),
  );

  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

function Icon({ name }: { name: "calendar" | "clock" | "location" | "heart" | "arrow" | "play" | "pause" | "chevron" }) {
  const paths: Record<typeof name, ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    play: <path d="m9 7 8 5-8 5Z" />,
    pause: <><path d="M9 7v10M15 7v10" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Countdown() {
  const [remaining, setRemaining] = useState<RemainingTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => setRemaining(getRemainingTime());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units = [
    { label: "يوم", value: remaining.days },
    { label: "ساعة", value: remaining.hours },
    { label: "دقيقة", value: remaining.minutes },
    { label: "ثانية", value: remaining.seconds },
  ];

  return (
    <div className="countdown" aria-label="الوقت المتبقي على عقد القران">
      {units.map((unit) => (
        <div className="countdown-unit" key={unit.label}>
          <strong>{String(unit.value).padStart(2, "0")}</strong>
          <span>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

function VocalButton() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`music-control ${playing ? "is-playing" : ""}`}>
      {playing ? (
        <iframe
          className="music-frame"
          src={`https://www.youtube-nocookie.com/embed/${VOCAL_TRACK_ID}?autoplay=1&controls=0&loop=1&playlist=${VOCAL_TRACK_ID}&start=0`}
          title="بارك الله لكما — فوكال بدون موسيقى"
          allow="autoplay"
        />
      ) : null}
      <button
        type="button"
        onClick={() => setPlaying((current) => !current)}
        aria-label={playing ? "إيقاف الدعاء" : "تشغيل بارك الله لكما بدون موسيقى"}
        aria-pressed={playing}
      >
        <span className="music-icon"><Icon name={playing ? "pause" : "play"} /></span>
        <span className="music-label">
          {playing ? <span className="eq" aria-hidden="true"><i /><i /><i /></span> : null}
          <span className="music-copy">
            <b>{playing ? "يُعرض الآن" : "استمعوا"}</b>
            <small>{playing ? "إيقاف الدعاء" : "بارك الله لكما · فوكال"}</small>
          </span>
        </span>
      </button>
    </div>
  );
}

function VenueMap() {
  const mapElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let mapInstance: import("leaflet").Map | undefined;

    void import("leaflet").then((leaflet) => {
      if (!active || !mapElement.current) return;
      mapInstance = leaflet.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: false }).setView(INVITATION.coordinates, 14);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "" }).addTo(mapInstance);
      const markerIcon = leaflet.divIcon({ className: "venue-marker", html: '<span aria-hidden="true">♥</span>', iconSize: [48, 48], iconAnchor: [24, 46] });
      leaflet.marker(INVITATION.coordinates, { icon: markerIcon }).addTo(mapInstance).bindPopup(`<strong>${INVITATION.venue}</strong>`);
    });

    return () => {
      active = false;
      mapInstance?.remove();
    };
  }, []);

  return <div ref={mapElement} className="map-canvas" aria-label="خريطة مكان عقد القران" />;
}

function WishForm() {
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submitWish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    const form = new FormData(event.currentTarget);
    const trimmedMessage = message.trim();

    if (form.get("website")) {
      setGuestName("");
      setMessage("");
      setStatus("success");
      return;
    }
    if (trimmedMessage.length < 2 || trimmedMessage.length > 500) {
      setErrorMessage("اكتبي رسالة من حرفين إلى 500 حرف.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch(wishesEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim().slice(0, 60) || "ضيف محب",
          message: trimmedMessage,
          website: form.get("website"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "تعذر إرسال الرسالة.");
      setGuestName("");
      setMessage("");
      setStatus("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setErrorMessage(
        message.startsWith("تعذر") || message.startsWith("اكتبي")
          ? message
          : "تعذر إرسال الرسالة.",
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="wish-success" role="status">
        <span><Icon name="heart" /></span>
        <p className="eyebrow">وصلتنا رسالتكم</p>
        <h3>شكرًا لأنكم شاركتمونا الفرحة</h3>
        <button type="button" onClick={() => setStatus("idle")}>اكتبوا رسالة أخرى</button>
      </div>
    );
  }

  return (
    <form className="wish-form" onSubmit={submitWish}>
      <div className="field-group">
        <label htmlFor="guest-name">الاسم</label>
        <input id="guest-name" value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={60} placeholder="اكتبوا اسمكم (اختياري)" autoComplete="name" />
      </div>
      <div className="field-group">
        <label htmlFor="wish-message">رسالتكم لنا</label>
        <textarea id="wish-message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={2} maxLength={500} rows={5} placeholder="دعوة من القلب، نصيحة لبداية العمر، أو كلمة نحتفظ بها..." required />
        <span className="character-count">{message.length} / 500</span>
      </div>
      <label className="honeypot" aria-hidden="true">الموقع الإلكتروني<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {status === "error" ? <p className="form-error" role="alert">{errorMessage}</p> : null}
      <button className="send-wish-button" type="submit" disabled={status === "sending"}>
        <span>{status === "sending" ? "جاري الإرسال..." : "أرسلوا رسالتكم"}</span><Icon name="heart" />
      </button>
    </form>
  );
}

export default function Home() {
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);

  const openInvitation = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setOpened(true), 1180);
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(invitationJsonLd).replaceAll("<", "\\u003c") }} />
      {!opened ? (
        <section className={`envelope-stage ${opening ? "is-opening" : ""}`} aria-label="افتح دعوة عقد القران">
          <div className="intro-wash intro-wash-one" /><div className="intro-wash intro-wash-two" />
          <div className="intro-copy">
            <span className="intro-monogram">ع <span className="ampersand">&amp;</span> ن</span>
            <p className="eyebrow">دعوة من القلب</p>
            <p className="intro-title">إلى مَن نحب</p>
            <p>يسعدنا أن تكونوا بيننا في يومٍ نبدأ به حكايتنا.</p>
          </div>
          <div className="envelope-column">
            <div className="envelope-wrap">
              <button className="envelope" type="button" onClick={openInvitation} aria-label="افتحوا الظرف">
                <span className="env-scene" aria-hidden="true">
                  <span className="env-shadow" />
                  <span className="env-body" />
                  <span className="env-card">
                    <span>عقد قران</span>
                    <strong>{INVITATION.groom} <span className="ampersand">&amp;</span> {INVITATION.bride}</strong>
                    <small>06 · 11 · 2026</small>
                  </span>
                  <span className="env-flap"><span className="env-photo" /></span>
                  <span className="env-crease env-crease-left" />
                  <span className="env-crease env-crease-right" />
                  <span className="wax-seal"><span>ن</span></span>
                </span>
              </button>
            </div>
            <button className="open-button" type="button" onClick={openInvitation}><span>افتحوا دعوتكم</span><Icon name="arrow" /></button>
          </div>
        </section>
      ) : null}

      <main className={`invitation ${opened ? "is-visible" : ""}`}>
        <section className="hero" aria-labelledby="invitation-title">
          <div className="hero-art" aria-hidden="true" />
          <div className="hero-topline">
            <span className="hero-kicker">دعوة عقد قران</span>
            <span className="hero-monogram">ع <span className="ampersand">&amp;</span> ن</span>
            <div className="hero-tools">
              <time className="hero-date" dateTime="2026-11-06"><span>06</span><span>11</span><span>2026</span></time>
              <VocalButton />
            </div>
          </div>
          <div className="hero-content">
            <div className="verse-card">
              <p className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
              <blockquote>﴿ وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ﴾</blockquote>
              <p className="surah">سورة الروم · الآية ٢١</p>
            </div>
            <div className="hero-title-wrap">
              <p>بكل الحب، نتشرف بدعوتكم لحضور عقد قران</p>
              <h1 id="invitation-title"><span>{INVITATION.groom}</span><span className="ampersand">&amp;</span><span>{INVITATION.bride}</span></h1>
              <p className="blessing">حضوركم يكمّل فرحتنا</p>
            </div>
            <a className="scroll-cue" href="#details" aria-label="انتقل إلى تفاصيل الدعوة">
              <span className="scroll-cue-label">اكتشفوا التفاصيل</span>
              <span className="scroll-cue-icon" aria-hidden="true"><Icon name="chevron" /></span>
            </a>
          </div>
        </section>

        <section className="details-section" id="details" aria-labelledby="details-title">
          <div className="date-poster" aria-hidden="true"><span>NOV</span><strong>06</strong><small>2026</small></div>
          <div className="section-heading">
            <p className="eyebrow">موعدنا يقترب</p>
            <h2 id="details-title">نلتقي على خير ومحبة</h2>
            <p className="section-intro">ننتظركم لتشاركونا لحظة نبدأ بها أجمل فصول العمر.</p>
          </div>
          <Countdown />
          <div className="detail-grid">
            <article className="detail-card"><span className="detail-icon"><Icon name="calendar" /></span><p>اليوم والتاريخ</p><h3>{INVITATION.day}<br />{INVITATION.gregorianDate}</h3><span>{INVITATION.hijriDate}</span></article>
            <article className="detail-card featured"><span className="detail-icon"><Icon name="clock" /></span><p>الموعد</p><h3>{INVITATION.time}</h3><span>نسعد بوصولكم قبل الموعد بقليل</span></article>
            <article className="detail-card"><span className="detail-icon"><Icon name="location" /></span><p>المكان</p><h3>{INVITATION.venue}</h3><span>يشرفنا حضوركم</span></article>
          </div>
        </section>

        <section className="map-section" aria-labelledby="map-title">
          <div className="map-copy">
            <p className="eyebrow">مكان اللقاء</p><h2 id="map-title">خطوتكم إلينا<br />تكمّل فرحتنا</h2>
            <div className="venue-line"><Icon name="location" /><p>{INVITATION.venue}</p></div>
            <a href={INVITATION.mapSearchUrl} target="_blank" rel="noreferrer" className="directions-button"><span>افتحوا اتجاهات الوصول</span><Icon name="arrow" /></a>
          </div>
          <div className="map-frame"><VenueMap /></div>
        </section>

        <section className="wishes-section" aria-labelledby="wishes-title">
          <div className="wishes-copy">
            <span className="wish-heart"><Icon name="heart" /></span><p className="eyebrow">ذكرى منكم تبقى معنا</p>
            <h2 id="wishes-title">اتركوا لنا<br />دعوة من القلب</h2>
            <p>كلمة جميلة، دعوة صادقة، أو نصيحة لبداية العمر؛ رسائلكم ستبقى جزءًا عزيزًا من يومنا.</p>
          </div>
          <div className="wishes-form-card"><WishForm /></div>
        </section>

        <section className="closing-section">
          <div className="closing-art" aria-hidden="true" />
          <div className="closing-card">
            <span className="closing-monogram">ع <span className="ampersand">&amp;</span> ن</span><p>بارك الله لكما وبارك عليكما</p><h2>وجمع بينكما في خير</h2><span className="closing-mark">ننتظركم بكل الحب</span>
          </div>
        </section>
        <footer>
          <div className="footer-line">
            <span className="footer-names">عبدالرحمن <span className="ampersand">&amp;</span> نورا</span>
            <span className="footer-flower">✦</span>
            <span>6 نوفمبر 2026</span>
          </div>
          <p className="footer-credit">صنع بكل حب من أختكم ندى عزام، وأتمنى لكما كل الخير</p>
          <a className="footer-private" href={`${basePath}/messages/`}>رسائل الضيوف</a>
        </footer>
      </main>
    </>
  );
}
