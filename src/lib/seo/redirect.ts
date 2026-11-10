import { notFound, permanentRedirect } from "next/navigation";
import { getRedirect } from "@/lib/database/public";

/** Called when a slug isn't found: follows a recorded redirect for renamed slugs, else 404. */
export async function notFoundOrRedirect(path: string): Promise<never> {
  const to = await getRedirect(path);
  if (to && to !== path) permanentRedirect(to);
  notFound();
}
