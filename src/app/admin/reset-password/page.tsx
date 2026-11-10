import { AuthShell } from "@/components/admin/auth-shell";
import { ResetRequestForm } from "@/components/admin/auth-forms";
export const metadata = { title: "Reset password" };
export default function Page() { return <AuthShell title="Reset password"><ResetRequestForm /></AuthShell>; }
