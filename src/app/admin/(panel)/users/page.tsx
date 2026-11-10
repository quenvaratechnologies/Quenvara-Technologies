import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { InviteForm, UserRow } from "@/components/admin/users-ui";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const staff = await requireStaff("users");
  const db = await createServerSupabase();
  const { data } = await db.from("profiles").select("id, full_name, role, is_active").order("created_at");
  const canEdit = can(staff.role, "users", "update");
  return (
    <>
      <h1 className="text-2xl font-semibold">Users & roles</h1>
      <p className="mt-1 text-sm text-muted">Roles are stored server-side and enforced by the database. Only owners can invite users or change roles. All changes are audit-logged.</p>
      {can(staff.role, "users", "create") && <div className="mt-6"><InviteForm /></div>}
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Staff users</caption>
        <thead className="border-b border-line bg-surface-alt text-xs uppercase text-muted"><tr>{["Name", "Role", "Status", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{(data ?? []).map((u: any) => <UserRow key={u.id} u={u} canEdit={canEdit} isSelf={u.id === staff.id} />)}</tbody></table></div>
    </>
  );
}
