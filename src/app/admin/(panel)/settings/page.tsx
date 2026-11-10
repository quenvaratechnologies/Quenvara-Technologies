import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { SETTING_GROUPS, type SettingKey } from "@/lib/admin/settings-groups";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const staff = await requireStaff("settings");
  const db = await createServerSupabase();
  const { data } = await db.from("site_settings").select("key, value");
  const stored = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
  const flat = (key: SettingKey) => {
    const v = stored[key] ?? {};
    if (key !== "company") return v;
    return { ...v, social_linkedin: v.social?.linkedin, social_x: v.social?.x, social_github: v.social?.github, social_youtube: v.social?.youtube, social_facebook: v.social?.facebook, social_instagram: v.social?.instagram, offices: (v.offices ?? []).map((o: any) => (o.label ? `${o.label} | ${o.address}` : o.address)).join("\n") };
  };
  return (
    <>
      <h1 className="text-2xl font-semibold">Site settings</h1>
      <p className="mt-1 text-sm text-muted">Only add information that is true. Offices, emails and phone numbers are shown publicly exactly as entered.</p>
      <div className="mt-6 space-y-6">
        {(Object.keys(SETTING_GROUPS) as SettingKey[]).map((k) => (
          <SettingsForm key={k} groupKey={k} label={SETTING_GROUPS[k].label} fields={SETTING_GROUPS[k].fields as unknown as [string, string, string?][]} values={flat(k)} canEdit={can(staff.role, "settings", "update")} />
        ))}
      </div>
    </>
  );
}
