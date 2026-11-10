import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Asserts the TypeScript permission matrix equals public.role_permissions in a migrated database.
 * Enable with:  PARITY_PSQL="psql -h localhost -p 54322 -U postgres -d postgres" npm run test
 */
const cmd = process.env.PARITY_PSQL;
describe.skipIf(!cmd)("TS <-> SQL permission parity", () => {
  it("matches exactly", () => {
    const [bin, ...args] = cmd!.split(" ");
    const out = execFileSync(bin, [...args, "-At", "-c", "select role||':'||resource||':'||action from public.role_permissions"], { encoding: "utf8" });
    const sql = new Set(out.split("\n").filter(Boolean));
    const ts = new Set<string>();
    for (const [role, res] of Object.entries(PERMISSIONS)) for (const [r, acts] of Object.entries(res)) for (const a of acts ?? []) ts.add(`${role}:${r}:${a}`);
    expect([...ts].filter((x) => !sql.has(x))).toEqual([]);
    expect([...sql].filter((x) => !ts.has(x))).toEqual([]);
  });
});
