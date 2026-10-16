import { createHmac, createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 3000);
const dataFile = process.env.WISHES_DATA_FILE || path.join(process.cwd(), "data", "wishes.json");
const adminUser = process.env.ADMIN_USER || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessionSecret =
  process.env.WISHES_SESSION_SECRET ||
  createHash("sha256").update(`nura-wishes:${adminPassword}`).digest("hex");
const sessionMs = 7 * 24 * 60 * 60 * 1000;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ||
    "https://nadaazzzam.github.io,http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

let writeQueue = Promise.resolve();

function enqueue(operation) {
  const task = writeQueue.then(operation, operation);
  writeQueue = task.then(
    () => {},
    () => {},
  );
  return task;
}

function originAllowed(origin) {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (originAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function send(res, status, body, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(origin),
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 20_000) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function safeEqual(left, right) {
  const a = createHash("sha256").update(String(left)).digest();
  const b = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(a, b);
}

function signToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + sessionMs }),
  ).toString("base64url");
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(header) {
  const match = /^Bearer\s+(.+)$/i.exec(header || "");
  if (!match) return false;
  const [payload, signature] = match[1].trim().split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

async function readWishes() {
  try {
    const parsed = JSON.parse(await readFile(dataFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

function queueWrite(wishes) {
  return enqueue(() => writeWishes(wishes));
}

async function writeWishes(wishes) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  const temporary = `${dataFile}.tmp`;
  await writeFile(temporary, JSON.stringify(wishes, null, 2));
  await rename(temporary, dataFile);
}

function publicWish(wish) {
  return {
    id: wish.id,
    guestName: wish.guestName,
    message: wish.message,
    createdAt: wish.createdAt,
  };
}

function publishedWish(wish) {
  return {
    ...publicWish(wish),
    published: true,
  };
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/wishes")) {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, { ok: true }, origin);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/wishes/login") {
    try {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const username = String(payload.username || "");
      const password = String(payload.password || "");
      if (!adminUser || !adminPassword || !safeEqual(username, adminUser) || !safeEqual(password, adminPassword)) {
        send(res, 401, { error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, origin);
        return;
      }
      send(res, 200, { token: signToken() }, origin);
    } catch {
      send(res, 400, { error: "تعذر تسجيل الدخول." }, origin);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/wishes") {
    if (!verifyToken(req.headers.authorization)) {
      send(res, 401, { error: "انتهت الجلسة. سجّلوا الدخول مرة أخرى." }, origin);
      return;
    }

    try {
      const wishes = await readWishes();
      let changed = false;
      for (const wish of wishes) {
        if (!wish.id) {
          wish.id = randomUUID();
          changed = true;
        }
      }
      if (changed) await queueWrite(wishes);
      wishes.sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)));
      send(res, 200, { wishes: wishes.map(publicWish) }, origin);
    } catch {
      send(res, 500, { error: "تعذر تحميل الرسائل." }, origin);
    }
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/wishes") {
    if (!verifyToken(req.headers.authorization)) {
      send(res, 401, { error: "انتهت الجلسة. سجّلوا الدخول مرة أخرى." }, origin);
      return;
    }

    try {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const id = String(payload.id || "");
      if (!id) {
        send(res, 400, { error: "تعذر حذف الرسالة." }, origin);
        return;
      }
      const wishes = await readWishes();
      const remaining = wishes.filter((wish) => wish.id !== id);
      if (remaining.length === wishes.length) {
        send(res, 404, { error: "تعذر حذف الرسالة." }, origin);
        return;
      }
      await queueWrite(remaining);
      send(res, 200, { deleted: true }, origin);
    } catch {
      send(res, 500, { error: "تعذر حذف الرسالة." }, origin);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/wishes/published") {
    try {
      const wishes = await readWishes();
      const published = wishes
        .filter((wish) => wish.published === true)
        .sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)))
        .map(publishedWish);
      send(res, 200, { wishes: published }, origin);
    } catch {
      send(res, 500, { error: "تعذر تحميل الرسائل المنشورة." }, origin);
    }
    return;
  }

  if (req.method === "PATCH" && url.pathname === "/api/wishes/published") {
    if (!verifyToken(req.headers.authorization)) {
      send(res, 401, { error: "انتهت الجلسة. سجّلوا الدخول مرة أخرى." }, origin);
      return;
    }

    try {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const ids = [
        ...new Set(
          (Array.isArray(payload.ids) ? payload.ids : [])
            .map((id) => String(id))
            .filter(Boolean),
        ),
      ];

      if (ids.length === 0 || typeof payload.published !== "boolean") {
        send(res, 400, { error: "اختاروا رسالة واحدة على الأقل." }, origin);
        return;
      }

      const missing = await enqueue(async () => {
        const wishes = await readWishes();
        const selected = new Set(ids);
        const matches = wishes.filter((wish) => selected.has(String(wish.id)));
        if (payload.published && matches.length !== ids.length) return true;

        const publishedAt = new Date().toISOString();
        for (const wish of wishes) {
          if (!selected.has(String(wish.id))) continue;
          wish.published = payload.published;
          if (payload.published) wish.publishedAt = publishedAt;
          else delete wish.publishedAt;
        }
        await writeWishes(wishes);
        return false;
      });

      if (missing) {
        send(res, 404, { error: "تعذر العثور على بعض الرسائل المحددة." }, origin);
        return;
      }

      send(res, 200, { updated: ids.length, published: payload.published }, origin);
    } catch {
      send(res, 500, { error: "تعذر تحديث حالة النشر." }, origin);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/wishes") {
    try {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const guestName = String(payload.guestName || "").trim().slice(0, 60) || "ضيف محب";
      const message = String(payload.message || "").trim();

      if (payload.website) {
        send(res, 201, { saved: true }, origin);
        return;
      }

      if (message.length < 2 || message.length > 500) {
        send(res, 400, { error: "اكتبي رسالة من حرفين إلى 500 حرف." }, origin);
        return;
      }

      const wishes = await readWishes();
      wishes.push({
        id: randomUUID(),
        guestName,
        message,
        createdAt: new Date().toISOString(),
      });
      await queueWrite(wishes);
      send(res, 201, { saved: true }, origin);
    } catch {
      send(res, 500, { error: "تعذر حفظ رسالتك الآن. حاولي مرة أخرى." }, origin);
    }
    return;
  }

  send(res, 404, { error: "Not found" }, origin);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Wishes API listening on ${port}`);
});
