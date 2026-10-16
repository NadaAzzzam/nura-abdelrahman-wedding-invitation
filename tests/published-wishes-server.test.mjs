import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function startServer() {
  const directory = await mkdtemp(path.join(tmpdir(), "nura-wishes-"));
  const port = 39000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      ADMIN_USER: "admin",
      ADMIN_PASSWORD: "secret",
      WISHES_SESSION_SECRET: "test-secret",
      WISHES_DATA_FILE: path.join(directory, "wishes.json"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("wishes server did not start")), 8000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("listening")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`wishes server exited with ${code}`));
    });
  });

  return {
    base: `http://127.0.0.1:${port}`,
    async stop() {
      child.kill();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test("publishes and hides wishes through the wishes API", async () => {
  const server = await startServer();
  try {
    const created = await fetch(`${server.base}/api/wishes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: "سارة", message: "ألف مبروك" }),
    });
    assert.equal(created.status, 201);

    const hidden = await fetch(`${server.base}/api/wishes/published`);
    assert.equal(hidden.status, 200);
    assert.deepEqual(await hidden.json(), { wishes: [] });

    const denied = await fetch(`${server.base}/api/wishes/published`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["missing"], published: true }),
    });
    assert.equal(denied.status, 401);

    const login = await fetch(`${server.base}/api/wishes/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "secret" }),
    });
    const { token } = await login.json();
    const wishes = await fetch(`${server.base}/api/wishes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { wishes: inbox } = await wishes.json();
    assert.equal(inbox.length, 1);

    const published = await fetch(`${server.base}/api/wishes/published`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [inbox[0].id], published: true }),
    });
    assert.equal(published.status, 200);

    const visible = await fetch(`${server.base}/api/wishes/published`);
    const body = await visible.json();
    assert.equal(body.wishes.length, 1);
    assert.equal(body.wishes[0].id, inbox[0].id);
    assert.equal(body.wishes[0].published, true);
    assert.equal(body.wishes[0].message, "ألف مبروك");

    const preflight = await fetch(`${server.base}/api/wishes/published`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://nadaazzzam.github.io",
        "Access-Control-Request-Method": "PATCH",
      },
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get("access-control-allow-methods"), /PATCH/);
    assert.equal(preflight.headers.get("access-control-allow-origin"), "https://nadaazzzam.github.io");

    const unpublished = await fetch(`${server.base}/api/wishes/published`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [inbox[0].id], published: false }),
    });
    assert.equal(unpublished.status, 200);
    assert.deepEqual(await (await fetch(`${server.base}/api/wishes/published`)).json(), { wishes: [] });
  } finally {
    await server.stop();
  }
});
