import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getCategories, getMyAlertSubscriptions, getTaxonomyKeywords } from '@/lib/queries';
import AlertSubscriptionsManager from '@/components/alerts/alert-subscriptions-manager';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const [subscriptions, categories, keywords] = await Promise.all([
    getMyAlertSubscriptions(user.id),
    getCategories(),
    getTaxonomyKeywords(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <h1 className="text-3xl font-semibold text-slate-900">Alert Subscriptions</h1>
        <p className="mt-2 text-slate-500">Get notified when new research matches your categories or keywords.</p>
      </div>

      <AlertSubscriptionsManager subscriptions={subscriptions} categories={categories} keywords={keywords} />
    </div>
  );
}
