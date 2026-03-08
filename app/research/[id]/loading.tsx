import { Skeleton } from '@/components/ui/skeleton';

export default function ResearchDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />

      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-4 h-10 w-4/5" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <Skeleton className="mt-8 h-5 w-28" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </div>
    </div>
  );
}
