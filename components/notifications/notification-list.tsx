'use client';

import Link from 'next/link';
import { useSyncExternalStore, useTransition } from 'react';
import { markAllNotificationsRead, markNotificationRead } from '@/actions/user-features';
import { NotificationItem } from '@/types/research';

type NotificationListProps = {
  items: NotificationItem[];
};

export default function NotificationList({ items }: NotificationListProps) {
  const [isPending, startTransition] = useTransition();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {hydrated ? (
          <button
            type="button"
            suppressHydrationWarning
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsRead();
              })
            }
            disabled={isPending}
            className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
          >
            Mark all read
          </button>
        ) : (
          <span className="h-9 w-28 rounded-md border border-blue-100 bg-white/60" aria-hidden="true" />
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No notifications yet.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              {!item.is_read ? (
                hydrated ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() =>
                      startTransition(async () => {
                        await markNotificationRead(item.id);
                      })
                    }
                    className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                  >
                    Mark read
                  </button>
                ) : (
                  <span className="h-6 w-16 rounded-md bg-blue-50" aria-hidden="true" />
                )
              ) : (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">Read</span>
              )}
            </div>
            {item.related_research_id ? (
              <Link
                href={`/research/${item.related_research_id}`}
                className="mt-3 inline-block text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Open related research
              </Link>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
