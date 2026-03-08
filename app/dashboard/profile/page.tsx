import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import UserProfileForm from '@/components/profile/user-profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <h1 className="text-3xl font-semibold text-slate-900">User Profile</h1>
        <p className="mt-2 text-slate-500">
          Manage your profile details. This page is available to admin, researcher, and viewer roles.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <UserProfileForm user={user} />
      </div>
    </div>
  );
}
