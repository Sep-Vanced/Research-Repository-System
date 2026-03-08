import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getMyNotifications } from '@/lib/queries';
import NotificationList from '@/components/notifications/notification-list';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const notifications = await getMyNotifications(user.id);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <h1 className="text-3xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-2 text-slate-500">Track updates for submissions, moderation, and account actions.</p>
      </div>
      <NotificationList items={notifications} />
    </div>
  );
}
