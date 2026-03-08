import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getUnreadNotificationsCount } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }
  const unreadNotificationsCount = await getUnreadNotificationsCount(user.id);

  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  return (
    <DashboardShell
      user={{
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      }}
      formattedTime={formattedTime}
      formattedDate={formattedDate}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </DashboardShell>
  );
}
