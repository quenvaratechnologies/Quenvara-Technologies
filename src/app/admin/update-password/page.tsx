import { AuthShell } from "@/components/admin/auth-shell";
import { UpdatePasswordForm } from "@/components/admin/auth-forms";
export const metadata = { title: "Set new password" };
export default function Page() { return <AuthShell title="Set a new password"><UpdatePasswordForm /></AuthShell>; }
