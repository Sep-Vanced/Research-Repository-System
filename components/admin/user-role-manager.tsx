'use client';

import { useState, useTransition } from 'react';
import { updateUserRole } from '@/actions/research';
import { User, UserRole } from '@/types/research';

type UserRoleManagerProps = {
  users: User[];
};

export default function UserRoleManager({ users }: UserRoleManagerProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, role: UserRole) => {
    setPendingId(userId);
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-3">
      {users.map((u) => {
        const busy = isPending && pendingId === u.id;
        return (
          <div key={u.id} className="flex flex-col justify-between gap-3 rounded-lg border border-blue-100 bg-white/90 p-4 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="line-clamp-1 font-semibold text-[var(--foreground)]">{u.full_name || 'Unnamed User'}</p>
              <p className="line-clamp-1 text-sm text-[var(--foreground)]/70">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                disabled={busy}
                suppressHydrationWarning
                className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-blue-400"
              >
                <option value="viewer">viewer</option>
                <option value="researcher">researcher</option>
                <option value="admin">admin</option>
              </select>
              {busy ? <span className="text-xs text-blue-600">Saving...</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
