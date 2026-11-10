import { redirect } from "next/navigation";
import { AuthShell } from "@/components/admin/auth-shell";
import { LoginForm } from "@/components/admin/auth-forms";
import { getStaff, safeAdminRedirect } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const sp = await searchParams;
  if (await getStaff()) redirect(safeAdminRedirect(sp.next));
  return (
    <AuthShell title="Sign in">
      {sp.expired && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your session expired. Please sign in again.</p>}
      <LoginForm next={safeAdminRedirect(sp.next)} />
    </AuthShell>
  );
}
