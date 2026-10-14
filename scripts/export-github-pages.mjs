import { spawn } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "app", "api");
const hiddenApiDir = path.join(root, ".api-static-export-backup");

process.env.STATIC_EXPORT = "1";
process.env.NEXT_PUBLIC_STATIC_SITE ??= "1";
process.env.NEXT_PUBLIC_BASE_PATH ??= "/nura-abdelrahman-wedding-invitation";

async function moveDir(from, to) {
  await rm(to, { recursive: true, force: true });
  if (process.platform === "win32") {
    await new Promise((resolve, reject) => {
      const child = spawn(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `Move-Item -LiteralPath '${from.replaceAll("'", "''")}' -Destination '${to.replaceAll("'", "''")}' -Force`,
        ],
        { stdio: "inherit" },
      );
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`Could not move ${from} to ${to}.`)),
      );
    });
    return;
  }

  await rename(from, to);
}

await moveDir(apiDir, hiddenApiDir);

let exitCode = 1;

try {
  await mkdir(path.join(root, "public"), { recursive: true });
  await writeFile(path.join(root, "public", ".nojekyll"), "");

  exitCode = await new Promise((resolve, reject) => {
    const child = spawn("npx", ["next", "build"], {
      cwd: root,
      env: process.env,
      shell: true,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await moveDir(hiddenApiDir, apiDir);
}

if (exitCode !== 0) {
  process.exit(exitCode);
}
