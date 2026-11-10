#!/usr/bin/env node
/**
 * Reproducible end-to-end run: starts a mock Supabase REST server, builds the app against it,
 * runs Playwright, and always cleans up. Extra args are passed to Playwright.
 */
import { spawn, spawnSync } from "node:child_process";

const MOCK_PORT = process.env.MOCK_PORT ?? "54399";
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key-000000000000000000",
  SUPABASE_SERVICE_ROLE_KEY: "e2e-service-key-0000000000000000",
  SITE_URL: `http://localhost:${process.env.E2E_PORT ?? 3100}`,
  MOCK_PORT,
};

const mock = spawn(process.execPath, ["tests/e2e/support/mock-supabase.mjs"], { env, stdio: "inherit" });
const stop = () => { try { mock.kill(); } catch {} };
process.on("exit", stop);
await new Promise((r) => setTimeout(r, 800));

let code = 1;
try {
  if (!process.env.SKIP_BUILD) {
    const b = spawnSync("npx", ["next", "build"], { env, stdio: "inherit" });
    if (b.status !== 0) throw new Error("build failed");
  }
  code = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], { env, stdio: "inherit" }).status ?? 1;
} finally { stop(); }
process.exit(code);
