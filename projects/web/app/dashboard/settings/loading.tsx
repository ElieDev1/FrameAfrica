import { Skeleton } from '@/components/Skeleton';

/** Settings loading state — header, then grouped integration cards. */
export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      {Array.from({ length: 3 }).map((_, g) => (
        <section key={g}>
          <div className="border-b border-border pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
