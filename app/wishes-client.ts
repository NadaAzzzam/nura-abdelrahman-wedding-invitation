export type GuestWish = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

const wishesEndpoint =
  process.env.NEXT_PUBLIC_WISHES_ENDPOINT ||
  "https://nura-wedding-wishes.bonto.run/api/wishes";
const sessionName = "nura-wishes-session";
const wrongLogin = "اسم المستخدم أو كلمة المرور غير صحيحة.";

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export function signOut() {
  sessionStorage.removeItem(sessionName);
}

export function restoreSession() {
  return sessionStorage.getItem(sessionName);
}

export async function signIn(username: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${wishesEndpoint}/login`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
  } catch {
    throw new Error("تعذر تسجيل الدخول.");
  }

  if (!response.ok) {
    throw new Error(response.status === 401 ? wrongLogin : await readError(response, "تعذر تسجيل الدخول."));
  }

  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("تعذر تسجيل الدخول.");
  sessionStorage.setItem(sessionName, body.token);
  return body.token;
}

export async function listWishes(token: string) {
  let response: Response;
  try {
    response = await fetch(wishesEndpoint, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("تعذر تحميل الرسائل.");
  }

  if (response.status === 401) {
    signOut();
    throw new Error("انتهت الجلسة. سجّلوا الدخول مرة أخرى.");
  }
  if (!response.ok) throw new Error(await readError(response, "تعذر تحميل الرسائل."));

  const body = (await response.json()) as { wishes?: GuestWish[] };
  return Array.isArray(body.wishes) ? body.wishes : [];
}

export async function deleteWish(token: string, id: string) {
  let response: Response;
  try {
    response = await fetch(wishesEndpoint, {
      method: "DELETE",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
  } catch {
    throw new Error("تعذر حذف الرسالة.");
  }

  if (!response.ok) throw new Error(await readError(response, "تعذر حذف الرسالة."));
}
