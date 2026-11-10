import Link from "next/link";
import { AuthShell } from "@/components/admin/auth-shell";
export const metadata = { title: "Access denied" };
export default function Forbidden() {
  return <AuthShell title="Access denied"><p className="text-muted">Your role does not permit access to that area.</p><Link href="/admin" className="mt-6 inline-block text-brand hover:underline">Back to dashboard</Link></AuthShell>;
}
