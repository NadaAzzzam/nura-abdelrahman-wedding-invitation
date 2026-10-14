"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  deleteWish,
  listWishes,
  restoreSession,
  signIn,
  signOut,
  type GuestWish,
} from "../wishes-client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function formatWishDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function MessagesPage() {
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [listError, setListError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const showLogin = (message = "") => {
    signOut();
    setSessionToken(null);
    setWishes([]);
    setPhase("login");
    setLoginError(message);
  };

  const loadWishes = async (token: string) => {
    setLoadingWishes(true);
    setListError("");
    try {
      setWishes(await listWishes(token));
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تحميل الرسائل.";
      if (message.includes("الجلسة")) {
        showLogin(message);
        return;
      }
      setListError(message);
    } finally {
      setLoadingWishes(false);
    }
  };

  useEffect(() => {
    let active = true;
    const token = restoreSession();
    if (!active) return;
    if (!token) {
      setPhase("login");
      return;
    }
    setSessionToken(token);
    setPhase("ready");
    void loadWishes(token);

    return () => {
      active = false;
    };
  }, []);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSigningIn(true);
    setLoginError("");

    try {
      const token = await signIn(username, password);
      setSessionToken(token);
      setPassword("");
      setPhase("ready");
      await loadWishes(token);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "تعذر تسجيل الدخول.");
    } finally {
      setSigningIn(false);
    }
  };

  const logout = () => {
    setUsername("");
    setPassword("");
    showLogin();
  };

  const removeWish = async (id: string) => {
    if (!sessionToken || !window.confirm("حذف هذه الرسالة؟")) return;
    setDeletingId(id);
    setListError("");

    try {
      await deleteWish(sessionToken, id);
      setWishes((current) => current.filter((wish) => wish.id !== id));
    } catch (error) {
      setListError(error instanceof Error ? error.message : "تعذر حذف الرسالة.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="messages-page">
      <section className="messages-card" aria-labelledby="messages-title">
        <p className="eyebrow">صفحة خاصة</p>
        <h1 id="messages-title">رسائل الضيوف</h1>
        <p className="messages-intro">هنا تصل كلمات من كتبوا لكم في الدعوة.</p>

        {phase === "checking" ? <p className="messages-status">جاري التحميل...</p> : null}

        {phase === "login" ? (
          <form className="wish-form" onSubmit={submitLogin}>
            <div className="field-group">
              <label htmlFor="wishes-username">اسم المستخدم</label>
              <input
                id="wishes-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="wishes-password">كلمة المرور</label>
              <input
                id="wishes-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {loginError ? <p className="form-error" role="alert">{loginError}</p> : null}
            <button className="send-wish-button" type="submit" disabled={signingIn}>
              {signingIn ? "جاري التحقق..." : "دخول"}
            </button>
          </form>
        ) : null}

        {phase === "ready" ? (
          <div className="messages-board">
            <div className="messages-toolbar">
              <p>{loadingWishes ? "جاري تحميل الرسائل..." : `${wishes.length} رسالة`}</p>
              <div>
                <button type="button" onClick={() => sessionToken && void loadWishes(sessionToken)} disabled={loadingWishes}>
                  تحديث
                </button>
                <button type="button" onClick={logout}>خروج</button>
              </div>
            </div>
            {listError ? <p className="form-error" role="alert">{listError}</p> : null}
            {!loadingWishes && wishes.length === 0 ? (
              <p className="messages-empty">لم تصل أي رسالة بعد.</p>
            ) : (
              <ul className="wish-list">
                {wishes.map((wish) => (
                  <li className="wish-item" key={wish.id}>
                    <header>
                      <strong>{wish.guestName}</strong>
                      <time dateTime={wish.createdAt}>{formatWishDate(wish.createdAt)}</time>
                    </header>
                    <p>{wish.message}</p>
                    <button type="button" onClick={() => void removeWish(wish.id)} disabled={deletingId === wish.id}>
                      {deletingId === wish.id ? "جاري الحذف..." : "حذف"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <a className="messages-back" href={`${basePath}/`}>العودة إلى الدعوة</a>
      </section>
    </main>
  );
}
