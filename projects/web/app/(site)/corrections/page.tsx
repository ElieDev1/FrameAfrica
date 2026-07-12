import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCorrections } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getLocale } from '@/lib/i18n-server';
import { type Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Corrections & clarifications — Frame Africa',
  description: 'Our public log of corrections and clarifications on published stories.',
};

export const revalidate = 300;

const CONTENT = {
  en: {
    trustSafety: 'Trust & safety',
    title: 'Corrections & clarifications',
    subtitle:
      'When we get something wrong, we fix it in the open. Every correction to a published story is dated and logged here.',
    empty: 'No corrections have been issued yet.',
  },
  rw: {
    trustSafety: 'Kwizera & umutekano',
    title: 'Gukosora & gusobanura',
    subtitle:
      'Iyo twibeshye, turabikosora mu ruhame. Gukosorwa kose kw’inkuru yatangajwe kugaragazwa n’itariki kandi kukandikwa hano.',
    empty: 'Nta gukosora kwigeze gutangazwa ubu.',
  },
  fr: {
    trustSafety: 'Confiance & sécurité',
    title: 'Corrections & rectifications',
    subtitle:
      'En cas d’erreur, nous la corrigeons ouvertement. Chaque rectification d’un article publié est datée et répertoriée ici.',
    empty: 'Aucune correction n’a été publiée pour le moment.',
  },
};

export default async function CorrectionsPage() {
  const corrections = await fetchCorrections();
  const locale = await getLocale();
  const c = CONTENT[locale as Locale] ?? CONTENT.en;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{c.trustSafety}</p>
      <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">{c.title}</h1>
      <p className="mt-3 font-body text-muted">{c.subtitle}</p>

      {corrections.length === 0 ? (
        <p className="mt-10 font-body text-muted">{c.empty}</p>
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
