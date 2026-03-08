import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-5 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-9 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-6 w-64" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
