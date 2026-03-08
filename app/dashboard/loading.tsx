import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-[28rem]" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="mt-4 h-3 w-32" />
            <Skeleton className="mt-3 h-10 w-20" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-6 w-48" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
