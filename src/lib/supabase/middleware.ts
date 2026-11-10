import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and gates /admin. This is a first line of defence only;
 * every server action / route handler / query re-verifies identity and role via requireRole().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase Auth (unlike getSession()).
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isAdminArea = path === "/admin" || path.startsWith("/admin/");
  const isPublicAdminPath = ["/admin/login", "/admin/reset-password", "/admin/auth/callback"].includes(path);

  if (isAdminArea && !isPublicAdminPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    // Only same-site relative paths are ever used as redirect targets.
    if (path.startsWith("/admin")) url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  response.headers.set("X-Robots-Tag", isAdminArea ? "noindex, nofollow" : response.headers.get("X-Robots-Tag") ?? "");
  if (!isAdminArea) response.headers.delete("X-Robots-Tag");
  return response;
}
