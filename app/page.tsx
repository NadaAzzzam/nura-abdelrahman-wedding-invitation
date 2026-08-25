"use client";

import { useEffect, useRef, useState } from "react";

const INVITATION = {
  groom: "عبدالرحمن",
  bride: "نورا",
  dateTime: "2026-11-06T18:00:00+02:00",
  gregorianDate: "6 نوفمبر 2026",
  hijriDate: "26 جمادى الأولى 1448 هـ",
  time: "الساعة 6:00 مساءً",
  venue: "مسجد الشهيد حمزة بن عبد المطلب",
  coordinates: [30.0444, 31.2357] as [number, number],
  mapSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B3%D8%AC%D8%AF+%D8%A7%D9%84%D8%B4%D9%87%D9%8A%D8%AF+%D8%AD%D9%85%D8%B2%D8%A9+%D8%A8%D9%86+%D8%B9%D8%A8%D8%AF+%D8%A7%D9%84%D9%85%D8%B7%D9%84%D8%A8",
};

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

function Countdown() {
  const [remaining, setRemaining] = useState<RemainingTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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

function MusicButton() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`music-control ${playing ? "is-playing" : ""}`}>
      {playing ? (
        <iframe
          className="music-frame"
          src="https://www.youtube-nocookie.com/embed/mHpTdsBbYRM?autoplay=1&controls=0&loop=1&playlist=mHpTdsBbYRM"
          title="بارك الله لكما — النسخة الرسمية"
          allow="autoplay"
        />
      ) : null}
      <button
        type="button"
        onClick={() => setPlaying((current) => !current)}
        aria-label={playing ? "إيقاف الأغنية" : "تشغيل أغنية بارك الله لكما"}
        aria-pressed={playing}
      >
        <span className="music-icon" aria-hidden="true">
          {playing ? "Ⅱ" : "▶"}
        </span>
        <span>{playing ? "إيقاف الأنشودة" : "شغّلي الأنشودة"}</span>
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

      mapInstance = leaflet
        .map(mapElement.current, {
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: true,
        })
        .setView(INVITATION.coordinates, 14);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(mapInstance);

      const markerIcon = leaflet.divIcon({
        className: "venue-marker",
        html: '<span aria-hidden="true">♥</span>',
        iconSize: [46, 46],
        iconAnchor: [23, 44],
      });

      leaflet
        .marker(INVITATION.coordinates, { icon: markerIcon })
        .addTo(mapInstance)
        .bindPopup(`<strong>${INVITATION.venue}</strong>`);
    });

    return () => {
      active = false;
      mapInstance?.remove();
    };
  }, []);

  return <div ref={mapElement} className="map-canvas" aria-label="خريطة مكان عقد القران" />;
}

function DetailIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="detail-icon" aria-hidden="true">
      {children}
    </span>
  );
}

export default function Home() {
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);

  const openInvitation = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setOpened(true), 1100);
  };

  return (
    <>
      {!opened ? (
        <section
          className={`envelope-stage ${opening ? "is-opening" : ""}`}
          aria-label="افتح دعوة عقد القران"
        >
          <div className="intro-flowers intro-flowers-top" />
          <div className="intro-flowers intro-flowers-bottom" />
          <p className="intro-eyebrow">بكل الحب ندعوكم</p>
          <div className="envelope-wrap">
            <div className="envelope" aria-hidden="true">
              <div className="envelope-back" />
              <div className="invitation-card-mini">
                <span>دعوة عقد قران</span>
                <strong>
                  {INVITATION.groom} <b>&amp;</b> {INVITATION.bride}
                </strong>
              </div>
              <div className="envelope-pocket" />
              <div className="envelope-flap" />
              <div className="wax-seal">ن</div>
            </div>
          </div>
          <button className="open-button" type="button" onClick={openInvitation}>
            <span>افتح الدعوة</span>
            <span aria-hidden="true">←</span>
          </button>
          <p className="intro-hint">اضغطي لفتح الظرف</p>
        </section>
      ) : null}

      <main className={`invitation ${opened ? "is-visible" : ""}`}>
        <MusicButton />

        <section className="hero" aria-labelledby="invitation-title">
          <div className="hero-scrim" />
          <div className="hero-content">
            <p className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <blockquote>
              ﴿ وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا
              لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ﴾
            </blockquote>
            <p className="surah">الروم · ٢١</p>

            <div className="hero-title-wrap">
              <p>نتشرف بدعوتكم لحضور عقد قران</p>
              <h1 id="invitation-title">
                <span>{INVITATION.groom}</span>
                <i>&amp;</i>
                <span>{INVITATION.bride}</span>
              </h1>
              <p className="blessing">وذلك بمشيئة الله تعالى</p>
            </div>

            <a className="scroll-cue" href="#details" aria-label="انتقل إلى تفاصيل الدعوة">
              <span>التفاصيل</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="details-section" id="details" aria-labelledby="details-title">
          <div className="section-heading">
            <p>موعدنا يقترب</p>
            <h2 id="details-title">بانتظار حضوركم</h2>
            <span className="heading-flower">❀</span>
          </div>

          <Countdown />

          <div className="detail-grid">
            <article className="detail-card">
              <DetailIcon>◷</DetailIcon>
              <p>الوقت</p>
              <h3>{INVITATION.time}</h3>
            </article>
            <article className="detail-card featured">
              <DetailIcon>▦</DetailIcon>
              <p>التاريخ</p>
              <h3>{INVITATION.gregorianDate}</h3>
              <span>{INVITATION.hijriDate}</span>
            </article>
            <article className="detail-card">
              <DetailIcon>⌖</DetailIcon>
              <p>المكان</p>
              <h3>{INVITATION.venue}</h3>
            </article>
          </div>
        </section>

        <section className="map-section" aria-labelledby="map-title">
          <div className="map-copy">
            <p className="section-kicker">تشرّفنا زيارتكم</p>
            <h2 id="map-title">مكان عقد القران</h2>
            <p>{INVITATION.venue}</p>
            <a
              href={INVITATION.mapSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="directions-button"
            >
              <span aria-hidden="true">⌖</span>
              فتح اتجاهات الوصول
            </a>
          </div>
          <div className="map-frame">
            <VenueMap />
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-card">
            <p>بارك الله لهما وبارك عليهما</p>
            <h2>وجمع بينهما في خير</h2>
            <span className="closing-mark">عـــبـــدالـــرحـــمـــن &amp; نــــورا</span>
          </div>
        </section>

        <footer>
          <span>6 · 11 · 2026</span>
          <span className="footer-flower">❀</span>
          <span>دعوة بحب</span>
        </footer>
      </main>
    </>
  );
}
