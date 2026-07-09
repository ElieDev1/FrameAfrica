import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCorrections } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Corrections & clarifications',
  description: 'Our public log of corrections and clarifications on published stories.',
};

export const revalidate = 300;

export default async function CorrectionsPage() {
  const corrections = await fetchCorrections();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
        Trust &amp; safety
      </p>
      <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
        Corrections &amp; clarifications
      </h1>
      <p className="mt-3 font-body text-muted">
        When we get something wrong, we fix it in the open. Every correction to a published story is
        dated and logged here.
      </p>

      {corrections.length === 0 ? (
        <p className="mt-10 font-body text-muted">No corrections have been issued yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border border-t border-border">
          {corrections.map((c) => (
            <li key={c.id} className="py-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                {formatDate(c.createdAt)}
              </span>
              <p className="mt-1 font-body text-text">{c.note}</p>
              <Link
                href={`/article/${c.article.slug}`}
                className="mt-1 inline-block font-mono text-[11px] text-primary hover:underline"
              >
                {c.article.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
