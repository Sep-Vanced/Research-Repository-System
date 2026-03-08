'use client';

import { useState, useTransition } from 'react';
import { AlertSubscription, ResearchCategory, TaxonomyKeyword } from '@/types/research';
import { addAlertSubscription, deleteAlertSubscription } from '@/actions/alerts';

type AlertSubscriptionsManagerProps = {
  subscriptions: AlertSubscription[];
  categories: ResearchCategory[];
  keywords: TaxonomyKeyword[];
};

export default function AlertSubscriptionsManager({
  subscriptions,
  categories,
  keywords,
}: AlertSubscriptionsManagerProps) {
  const [scope, setScope] = useState<'category' | 'keyword'>('category');
  const [channel, setChannel] = useState<'in_app' | 'email'>('in_app');
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const options = scope === 'category' ? categories.map((c) => c.name) : keywords.map((k) => k.keyword);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2 md:grid-cols-4">
          <select value={scope} onChange={(e) => setScope(e.target.value as 'category' | 'keyword')} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="category">Category</option>
            <option value="keyword">Keyword</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value as 'in_app' | 'email')} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
          </select>
          <select value={value} onChange={(e) => setValue(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="">Select value</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending || !value}
            onClick={() =>
              startTransition(async () => {
                await addAlertSubscription(scope, value, channel);
                setValue('');
              })
            }
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Add Alert
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {subscriptions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No alert subscriptions yet.</p>
        ) : (
          subscriptions.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold uppercase">{sub.scope}</span>: {sub.value} ({sub.channel})
              </p>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteAlertSubscription(sub.id);
                  })
                }
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
