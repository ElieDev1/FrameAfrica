import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';

const MAX_SECTIONS = 6;

/** Top bar: wordmark + primary section navigation (top-level categories). */
export async function SiteHeader() {
  let sections: CategoryNode[] = [];
  try {
    sections = (await fetchCategories()).slice(0, MAX_SECTIONS);
  } catch {
    sections = []; // header still renders if the API is unreachable
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-heading text-xl font-black tracking-tight text-text">
          Frame<span className="text-primary">Africa</span>
        </Link>
        <nav className="hidden flex-wrap gap-4 md:flex">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/section/${section.slug}`}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-primary"
            >
              {section.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
