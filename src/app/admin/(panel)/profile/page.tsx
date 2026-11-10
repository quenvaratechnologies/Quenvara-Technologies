import { requireStaff } from "@/lib/auth/session";
import { ProfileForm, PasswordForm } from "@/components/admin/profile-forms";

export const metadata = { title: "My profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const staff = await requireStaff();
  return (
    <>
      <h1 className="text-2xl font-semibold">My profile</h1>
      <div className="mt-6 grid max-w-3xl gap-6">
        <ProfileForm fullName={staff.fullName} email={staff.email} role={staff.role} />
        <PasswordForm />
      </div>
    </>
  );
}
