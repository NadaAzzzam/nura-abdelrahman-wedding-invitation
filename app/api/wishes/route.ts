import { getDb } from "../../../db";
import { wishes } from "../../../db/schema";

type WishPayload = {
  guestName?: string;
  message?: string;
  website?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WishPayload;
    const guestName = payload.guestName?.trim().slice(0, 60) || "ضيف محب";
    const message = payload.message?.trim() ?? "";

    if (payload.website) {
      return Response.json({ saved: true }, { status: 201 });
    }

    if (message.length < 2 || message.length > 500) {
      return Response.json(
        { error: "اكتبي رسالة من حرفين إلى 500 حرف." },
        { status: 400 },
      );
    }

    await getDb().insert(wishes).values({ guestName, message });

    return Response.json({ saved: true }, { status: 201 });
  } catch {
    return Response.json(
      { error: "تعذر حفظ رسالتك الآن. حاولي مرة أخرى." },
      { status: 500 },
    );
  }
}
