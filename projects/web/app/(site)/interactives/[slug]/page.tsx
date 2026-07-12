import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentEngagement } from '@/components/ContentEngagement';
import { EmbedFrame } from '@/components/EmbedFrame';
import { formatDate } from '@/lib/format';
import { fetchInteractive } from '@/lib/interactives';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const it = await fetchInteractive(slug);
  if (!it) return { title: 'Not found' };
  return { title: it.title, description: it.description ?? undefined };
}

export default async function InteractiveDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const it = await fetchInteractive(slug);
  if (!it) notFound();

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Data &amp; interactive
        </p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {it.title}
        </h1>
        {it.description && (
          <p className="mt-3 max-w-3xl font-body text-lg text-muted">{it.description}</p>
        )}
        <p className="mt-3 font-mono text-[11px] text-faint">
          {it.source && <span>Source: {it.source} · </span>}
          {it.publishedAt && <span>{formatDate(it.publishedAt)}</span>}
        </p>
      </header>

      <div className="pt-8">
        <EmbedFrame src={it.embedUrl} title={it.title} aspectRatio={it.aspectRatio} />
      </div>

      <ContentEngagement type="interactive" id={it.id} path={`/interactives/${it.slug}`} />
    </article>
  );
}
