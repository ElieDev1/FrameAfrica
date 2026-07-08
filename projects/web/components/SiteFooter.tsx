import { headers } from 'next/headers';
import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { Wordmark } from './Wordmark';

// Placeholder columns — pages land in later slices, so these read as plain labels
// rather than dead links.
const COLUMNS: { title: string; items: string[] }[] = [
  { title: 'Company', items: ['About us', 'Newsroom', 'Careers', 'Advertise', 'Contact'] },
  { title: 'Products', items: ['Newsletters', 'Podcasts', 'Premium', 'Mobile app', 'RSS'] },
  { title: 'Legal', items: ['Privacy', 'Terms', 'Editorial code', 'Corrections', 'Cookies'] },
];

function ColumnHeading({ children }: { children: string }) {
  return (
    <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text">
      {children}
    </h3>
  );
}

export async function SiteFooter() {
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (pathname.startsWith('/dashboard')) return null;

  let sections: CategoryNode[] = [];
  try {
    sections = (await fetchCategories()).slice(0, 5);
  } catch {
    sections = [];
  }

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <Wordmark />
        <p className="mt-3 max-w-sm font-body text-sm text-muted">
          Independent journalism from Kigali for the continent and its diaspora.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <ColumnHeading>Sections</ColumnHeading>
            <ul className="mt-3 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`/section/${section.slug}`}
                    className="font-body text-sm text-muted hover:text-primary"
                  >
                    {section.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <ColumnHeading>{column.title}</ColumnHeading>
              <ul className="mt-3 flex flex-col gap-2">
                {column.items.map((item) => (
                  <li key={item} className="font-body text-sm text-faint">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Frame Africa Media Ltd · Kigali, Rwanda</p>
          <p>EN · Kinyarwanda · Français</p>
        </div>
      </div>
    </footer>
  );
}
