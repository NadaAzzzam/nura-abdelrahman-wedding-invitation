import { desc, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { publishedWishes } from "../../../db/schema";

const wishesEndpoint =
  process.env.NEXT_PUBLIC_WISHES_ENDPOINT ||
  "https://nura-wedding-wishes.bonto.run/api/wishes";

type ModerationPayload = {
  ids?: unknown;
  published?: unknown;
};

type RemoteWish = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

async function readyDatabase() {
  const db = getDb();
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS published_wishes (
      id TEXT PRIMARY KEY NOT NULL,
      guest_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      published_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  return db;
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  try {
    const db = await readyDatabase();
    const wishes = await db
      .select()
      .from(publishedWishes)
      .orderBy(desc(publishedWishes.createdAt));

    return json({
      wishes: wishes.map((wish) => ({ ...wish, published: true })),
    });
  } catch {
    return json({ error: "تعذر تحميل الرسائل المنشورة." }, 500);
  }
}

export async function PATCH(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return json({ error: "انتهت الجلسة. سجّلوا الدخول مرة أخرى." }, 401);
  }

  try {
    const payload = (await request.json()) as ModerationPayload;
    const ids = Array.isArray(payload.ids)
      ? [...new Set(payload.ids.map((id) => String(id)).filter(Boolean))]
      : [];

    if (ids.length === 0 || typeof payload.published !== "boolean") {
      return json({ error: "اختاروا رسالة واحدة على الأقل." }, 400);
    }

    const adminResponse = await fetch(wishesEndpoint, {
      cache: "no-store",
      headers: { Authorization: authorization },
    });
    if (adminResponse.status === 401) {
      return json({ error: "انتهت الجلسة. سجّلوا الدخول مرة أخرى." }, 401);
    }
    if (!adminResponse.ok) {
      return json({ error: "تعذر التحقق من الرسائل المحددة." }, 502);
    }

    const adminBody = (await adminResponse.json()) as { wishes?: RemoteWish[] };
    const availableWishes = Array.isArray(adminBody.wishes) ? adminBody.wishes : [];
    const selectedIds = new Set(ids);
    const selectedWishes = availableWishes.filter((wish) => selectedIds.has(String(wish.id)));

    if (payload.published && selectedWishes.length !== ids.length) {
      return json({ error: "تعذر العثور على بعض الرسائل المحددة." }, 404);
    }

    const db = await readyDatabase();
    if (payload.published) {
      const publishedAt = new Date().toISOString();
      for (const wish of selectedWishes) {
        await db
          .insert(publishedWishes)
          .values({
            id: String(wish.id),
            guestName: String(wish.guestName),
            message: String(wish.message),
            createdAt: String(wish.createdAt),
            publishedAt,
          })
          .onConflictDoUpdate({
            target: publishedWishes.id,
            set: {
              guestName: String(wish.guestName),
              message: String(wish.message),
              createdAt: String(wish.createdAt),
              publishedAt,
            },
          });
      }
    } else {
      await db.delete(publishedWishes).where(inArray(publishedWishes.id, ids));
    }

    return json({ updated: ids.length, published: payload.published });
  } catch {
    return json({ error: "تعذر تحديث حالة النشر." }, 500);
  }
}
