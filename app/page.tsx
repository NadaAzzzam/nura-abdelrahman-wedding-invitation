"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { basePath, invitationJsonLd } from "./site";

const INVITATION = {
  groom: "عبدالرحمن",
  bride: "نورا",
  dateTime: "2026-11-06T18:00:00+02:00",
  day: "الجمعة",
  gregorianDate: "6 نوفمبر 2026",
  hijriDate: "26 جمادى الأولى 1448 هـ",
  time: "بعد صلاة العشاء",
  venue: "مسجد عبدالله بن مسعود",
  area: "عين شمس، القاهرة",
  coordinates: [30.130129, 31.356288] as [number, number],
  mapSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=30.130129,31.356288",
};

const VOCAL_TRACK_ID = "qxjRGJezZkQ";
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

type VocalPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      width?: string;
      height?: string;
      host?: string;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: VocalPlayer }) => void;
        onStateChange?: (event: { data: number; target: VocalPlayer }) => void;
        onAutoplayBlocked?: () => void;
      };
    },
  ) => VocalPlayer;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return youtubeApiPromise;
}

function VocalButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VocalPlayer | null>(null);
  const userPausedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let player: VocalPlayer | null = null;
    const mount = document.createElement("div");
    container.appendChild(mount);

    const play = () => {
      if (!userPausedRef.current) playerRef.current?.playVideo?.();
    };

    const onGesture = () => play();
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);

    const removeGestureListeners = () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };

    void loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      player = new window.YT.Player(mount, {
        width: "1",
        height: "1",
        host: "https://www.youtube-nocookie.com",
        videoId: VOCAL_TRACK_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          loop: 1,
          playlist: VOCAL_TRACK_ID,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
          disablekb: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const frame = event.target.getIframe();
            frame.title = "بارك الله لكما — فوكال بدون موسيقى";
            frame.setAttribute("allow", "autoplay; encrypted-media");
            play();
          },
          onStateChange: (event) => {
            if (userPausedRef.current) {
              if (event.data === 1 || event.data === 3) event.target.pauseVideo();
              setPlaying(false);
              return;
            }
            setPlaying(event.data === 1 || event.data === 3);
            if (event.data === 1) removeGestureListeners();
          },
          onAutoplayBlocked: () => setPlaying(false),
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      removeGestureListeners();
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        mount.remove();
      }
    };
  }, []);

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) {
      userPausedRef.current = true;
      player.pauseVideo();
      setPlaying(false);
      return;
    }
    userPausedRef.current = false;
    player.playVideo();
  };

  return (
    <div className={`music-control ${playing ? "is-playing" : ""}`}>
      <div ref={containerRef} className="music-frame" />
      <button
        type="button"
        onClick={togglePlayback}
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
      mapInstance = leaflet.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: false }).setView(INVITATION.coordinates, 16);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "" }).addTo(mapInstance);
      const markerIcon = leaflet.divIcon({ className: "venue-marker", html: '<span aria-hidden="true">♥</span>', iconSize: [48, 48], iconAnchor: [24, 46] });
      leaflet.marker(INVITATION.coordinates, { icon: markerIcon }).addTo(mapInstance).bindPopup(`<strong>${INVITATION.venue}</strong><br />${INVITATION.area}`);
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
    window.setTimeout(() => setOpened(true), 700);
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(invitationJsonLd).replaceAll("<", "\\u003c") }} />
      <main className={`invitation ${opening || opened ? "is-visible" : "is-waiting"}`}>
        <section className="hero" aria-labelledby="invitation-title">
          <img className="hero-art" src={`${basePath}/watercolor-couple.png`} alt="" />
          <div className="hero-tools"><VocalButton /></div>
          <div className="hero-arch">
            <p className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <blockquote>وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا<br />لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً</blockquote>
            <p className="poster-lead">بقلوب تغمرها الفرح نتشرف بدعوتكم لحضور عقد قران</p>
            <h1 id="invitation-title"><span>{INVITATION.groom}</span><span className="ampersand">&amp;</span><span>{INVITATION.bride}</span></h1>
            <div className="poster-date">
              <p>{INVITATION.time}</p>
              <div className="poster-num"><span>نوفمبر</span><strong>6</strong><small>2026</small></div>
              <p>{INVITATION.day}</p>
            </div>
            <p className="poster-venue"><Icon name="location" /><span>ب{INVITATION.venue}<br />بعين شمس</span></p>
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
            <article className="detail-card"><span className="detail-icon"><Icon name="location" /></span><p>المكان</p><h3>{INVITATION.venue}</h3><span>{INVITATION.area}</span></article>
          </div>
        </section>

        <section className="map-section" aria-labelledby="map-title">
          <div className="map-copy">
            <p className="eyebrow">مكان اللقاء</p><h2 id="map-title">خطوتكم إلينا<br />تكمّل فرحتنا</h2>
            <div className="venue-line"><Icon name="location" /><p>{INVITATION.venue}<br />{INVITATION.area}</p></div>
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
          <img className="closing-art" src={`${basePath}/watercolor-couple.png`} alt="" />
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
          <p className="footer-credit" lang="en" dir="ltr">Made with love by <a className="footer-credit-link" href="mailto:nadaazzam123@outlook.com">Nada Azzam</a>, sister of the bride. Wishing you both all the best.</p>
        </footer>
      </main>

      {!opened ? (
        <button
          className={`envelope-stage ${opening ? "is-opening" : ""}`}
          type="button"
          onClick={openInvitation}
          aria-label="افتحوا دعوتكم"
        >
          <span className="lacy-panel-left">
            <span className="lacy-door lacy-door-left" aria-hidden="true" />
            <img className="pearl-clasp" src={`${basePath}/lace-clasp.png`} alt="" />
          </span>
          <span className="lacy-door lacy-door-right" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
