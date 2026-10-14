import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 3000);
const dataFile = path.join(process.cwd(), "data", "wishes.json");
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ||
    "https://nadaazzzam.github.io,http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

let writeQueue = Promise.resolve();

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function send(res, status, body, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(origin),
  };
  res.writeHead(status, headers);
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
  const task = writeQueue.then(async () => {
    await mkdir(path.dirname(dataFile), { recursive: true });
    const temporary = `${dataFile}.tmp`;
    await writeFile(temporary, JSON.stringify(wishes, null, 2));
    await rename(temporary, dataFile);
  });
  writeQueue = task.catch(() => {});
  return task;
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "OPTIONS" && url.pathname === "/api/wishes") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, { ok: true }, origin);
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
