"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  deleteWish,
  listWishes,
  restoreSession,
  setWishesPublished,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingPublication, setUpdatingPublication] = useState(false);

  const showLogin = useCallback((message = "") => {
    signOut();
    setSessionToken(null);
    setWishes([]);
    setSelectedIds([]);
    setPhase("login");
    setLoginError(message);
  }, []);

  const loadWishes = useCallback(async (token: string) => {
    setLoadingWishes(true);
    setListError("");
    try {
      setWishes(await listWishes(token));
      setSelectedIds([]);
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
  }, [showLogin]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const token = restoreSession();
      if (!active) return;
      if (!token) {
        setPhase("login");
        return;
      }
      setSessionToken(token);
      setPhase("ready");
      void loadWishes(token);
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadWishes]);

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
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
    } catch (error) {
      setListError(error instanceof Error ? error.message : "تعذر حذف الرسالة.");
    } finally {
      setDeletingId("");
    }
  };

  const toggleWish = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const toggleAllWishes = () => {
    setSelectedIds((current) =>
      current.length === wishes.length ? [] : wishes.map((wish) => wish.id),
    );
  };

  const updatePublication = async (published: boolean) => {
    if (!sessionToken || selectedIds.length === 0) return;
    setUpdatingPublication(true);
    setListError("");

    try {
      await setWishesPublished(sessionToken, selectedIds, published);
      const selected = new Set(selectedIds);
      setWishes((current) =>
        current.map((wish) => selected.has(wish.id) ? { ...wish, published } : wish),
      );
      setSelectedIds([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تحديث حالة النشر.";
      if (message.includes("الجلسة")) {
        showLogin(message);
        return;
      }
      setListError(message);
    } finally {
      setUpdatingPublication(false);
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
            {wishes.length > 0 ? (
              <div className="publication-toolbar" aria-label="أدوات نشر الرسائل">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === wishes.length}
                    onChange={toggleAllWishes}
                  />
                  <span>{selectedIds.length > 0 ? `${selectedIds.length} محدد` : "تحديد الكل"}</span>
                </label>
                <div>
                  <button
                    type="button"
                    className="publish-button"
                    onClick={() => void updatePublication(true)}
                    disabled={selectedIds.length === 0 || updatingPublication}
                  >
                    نشر المحدد
                  </button>
                  <button
                    type="button"
                    onClick={() => void updatePublication(false)}
                    disabled={selectedIds.length === 0 || updatingPublication}
                  >
                    إخفاء المحدد
                  </button>
                </div>
              </div>
            ) : null}
            {listError ? <p className="form-error" role="alert">{listError}</p> : null}
            {!loadingWishes && wishes.length === 0 ? (
              <p className="messages-empty">لم تصل أي رسالة بعد.</p>
            ) : (
              <ul className="wish-list">
                {wishes.map((wish) => (
                  <li className="wish-item" key={wish.id}>
                    <header>
                      <label className="wish-selector">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(wish.id)}
                          onChange={() => toggleWish(wish.id)}
                          aria-label={`تحديد رسالة ${wish.guestName}`}
                        />
                        <strong>{wish.guestName}</strong>
                      </label>
                      <time dateTime={wish.createdAt}>{formatWishDate(wish.createdAt)}</time>
                    </header>
                    <p>{wish.message}</p>
                    <div className="wish-item-footer">
                      <span className={`publication-status ${wish.published ? "is-published" : ""}`}>
                        {wish.published ? "منشورة في الدعوة" : "غير منشورة"}
                      </span>
                      <button type="button" onClick={() => void removeWish(wish.id)} disabled={deletingId === wish.id}>
                        {deletingId === wish.id ? "جاري الحذف..." : "حذف"}
                      </button>
                    </div>
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
