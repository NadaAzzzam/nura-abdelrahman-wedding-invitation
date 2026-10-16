import assert from "node:assert/strict";
import test from "node:test";

const wishesEndpoint =
  process.env.NEXT_PUBLIC_WISHES_ENDPOINT ||
  "https://nura-wedding-wishes.bonto.run/api/wishes";
const publishedWishesEndpoint = `${wishesEndpoint.replace(/\/$/, "")}/published`;
const wishesClient = await import("../app/wishes-client.ts");

test("marks only wishes present in the public publication list", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSessionStorage;
  });

  globalThis.sessionStorage = { removeItem() {} };
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url === publishedWishesEndpoint) {
      return Response.json({
        wishes: [{
          id: "wish-2",
          guestName: "سارة",
          message: "ألف مبروك",
          createdAt: "2026-10-16T18:00:00.000Z",
          published: true,
        }],
      });
    }

    return Response.json({
      wishes: [
        { id: "wish-1", guestName: "منى", message: "بارك الله لكما", createdAt: "2026-10-16T17:00:00.000Z" },
        { id: "wish-2", guestName: "سارة", message: "ألف مبروك", createdAt: "2026-10-16T18:00:00.000Z" },
      ],
    });
  };

  const wishes = await wishesClient.listWishes("session-token");
  assert.deepEqual(
    wishes.map(({ id, published }) => ({ id, published })),
    [
      { id: "wish-1", published: false },
      { id: "wish-2", published: true },
    ],
  );
});

test("sends selected message ids to the wishes publication endpoint", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSessionStorage;
  });

  globalThis.sessionStorage = { removeItem() {} };
  let request;
  globalThis.fetch = async (input, init) => {
    request = { input: String(input), init };
    return Response.json({ updated: 2, published: true });
  };

  await wishesClient.setWishesPublished("session-token", ["wish-1", "wish-2"], true);

  assert.equal(request.input, publishedWishesEndpoint);
  assert.equal(request.init.method, "PATCH");
  assert.equal(request.init.headers.Authorization, "Bearer session-token");
  assert.deepEqual(JSON.parse(request.init.body), {
    ids: ["wish-1", "wish-2"],
    published: true,
  });
});
