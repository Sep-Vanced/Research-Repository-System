import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getAuditEvents } from '@/lib/queries';
import AuditEventsPanel from '@/components/admin/audit-events-panel';

export const dynamic = 'force-dynamic';

export default async function AdminSecurityPage() {
  const user = await getUser();
  if (!user || user.role !== 'admin') redirect('/dashboard');

  const events = await getAuditEvents(200);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <h1 className="text-3xl font-semibold text-slate-900">Security & Audit Events</h1>
        <p className="mt-2 text-slate-500">Track role changes, moderation actions, downloads, and critical events.</p>
      </div>
      <AuditEventsPanel events={events} />
    </div>
  );
}
