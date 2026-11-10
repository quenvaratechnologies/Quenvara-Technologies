#!/usr/bin/env node
/**
 * Provision the FIRST owner account (there is no public registration).
 *
 *   node --env-file=.env.local scripts/provision-owner.mjs owner@company.com "Full Name"
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment.
 * Password: taken from OWNER_PASSWORD if set (min 12 chars), otherwise a strong random one is
 * generated and printed ONCE. Change it after first login (or use the password-reset flow).
 * Refuses to run if an active owner already exists, unless --allow-additional is passed.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const [email, fullName = ""] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const allowAdditional = process.argv.includes("--allow-additional");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { console.error("Usage: provision-owner.mjs <email> [\"Full Name\"]"); process.exit(1); }
if (!url || !key) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { count, error: cErr } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner").eq("is_active", true);
if (cErr) { console.error("Could not query profiles. Have the migrations been applied?", cErr.message); process.exit(1); }
if ((count ?? 0) > 0 && !allowAdditional) { console.error("An active owner already exists. Use the Users page, or pass --allow-additional."); process.exit(1); }

let password = process.env.OWNER_PASSWORD;
const generated = !password;
if (generated) password = randomBytes(18).toString("base64url");
if (password.length < 12) { console.error("OWNER_PASSWORD must be at least 12 characters"); process.exit(1); }

const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
if (error) { console.error("Could not create auth user:", error.message); process.exit(1); }

const { error: pErr } = await db.from("profiles").insert({ id: data.user.id, full_name: fullName, role: "owner", is_active: true });
if (pErr) {
  await db.auth.admin.deleteUser(data.user.id); // roll back so the script can be re-run
  console.error("Could not create profile (rolled back):", pErr.message);
  process.exit(1);
}

console.log(`Owner created: ${email}`);
if (generated) console.log(`Temporary password (shown once): ${password}`);
console.log("Sign in at /admin/login, then change the password.");
