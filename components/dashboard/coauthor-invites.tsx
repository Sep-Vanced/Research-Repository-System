'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { respondToCoauthorInvite } from '@/actions/coauthors';
import { CoauthorInvite } from '@/types/research';

type CoauthorInvitesProps = {
  invites: CoauthorInvite[];
};

export default function CoauthorInvites({ invites }: CoauthorInvitesProps) {
  const [isPending, startTransition] = useTransition();

  if (invites.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">No pending co-author invites.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {invites.map((invite) => (
        <div key={invite.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-700">
              You were invited as co-author (<span className="font-semibold">{invite.invited_email}</span>)
            </p>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold uppercase text-blue-700">
              {invite.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{new Date(invite.created_at).toLocaleString()}</p>
          <div className="mt-3 flex items-center gap-2">
            {invite.status === 'pending' ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await respondToCoauthorInvite(invite.id, 'accepted');
                    })
                  }
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await respondToCoauthorInvite(invite.id, 'declined');
                    })
                  }
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Decline
                </button>
              </>
            ) : null}
            <Link href={`/research/${invite.research_id}`} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Open Research
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
