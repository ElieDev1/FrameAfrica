import { Skeleton } from '@/components/Skeleton';

export default function ArticleLoading() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-6 h-10 w-full" />
      <Skeleton className="mt-3 h-10 w-4/5" />
      <Skeleton className="mt-6 h-4 w-64" />
      <div className="mt-5 flex gap-3">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-8 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </article>
  );
}
