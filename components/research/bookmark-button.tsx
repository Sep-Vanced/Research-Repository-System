'use client';

import { useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/actions/user-features';

type BookmarkButtonProps = {
  researchId: string;
  isBookmarked: boolean;
};

export default function BookmarkButton({ researchId, isBookmarked }: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await toggleBookmark(researchId);
        })
      }
      disabled={isPending}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
        isBookmarked ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
      }`}
      aria-label="Toggle bookmark"
    >
      <Bookmark className="h-3.5 w-3.5" />
      {isBookmarked ? 'Saved' : 'Save'}
    </button>
  );
}
