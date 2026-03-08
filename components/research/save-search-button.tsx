'use client';

import { useTransition } from 'react';
import { saveSearch } from '@/actions/user-features';

type SaveSearchButtonProps = {
  filters: Record<string, string | number | undefined>;
};

export default function SaveSearchButton({ filters }: SaveSearchButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const name = window.prompt('Name this search:');
    if (!name) return;
    startTransition(async () => {
      await saveSearch(name, filters);
    });
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isPending}
      className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
    >
      {isPending ? 'Saving...' : 'Save Search'}
    </button>
  );
}
