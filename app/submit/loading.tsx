import { Skeleton } from '@/components/ui/skeleton';

export default function SubmitLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 space-y-5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-36 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-11 w-full" />
          <div className="flex justify-end">
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
