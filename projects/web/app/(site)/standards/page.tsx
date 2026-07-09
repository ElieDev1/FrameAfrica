import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Editorial standards',
  description: "Frame Africa's editorial standards, ethics, and right of reply.",
};

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Accuracy first',
    body: 'We verify before we publish. Where facts are contested, we say so. When we get something wrong, we correct it promptly and in the open — see our public corrections log.',
  },
  {
    heading: 'Independence',
    body: 'Our journalism is not for sale. Advertising and commercial partnerships never influence coverage, and any sponsored content is clearly labelled as such.',
  },
  {
    heading: 'Fairness & right of reply',
    body: 'Anyone facing significant criticism in our reporting is given a fair opportunity to respond before publication. Requests for a right of reply are logged and reviewed by a senior editor.',
  },
  {
    heading: 'Sources & confidentiality',
    body: 'We protect confidential sources. A tipster’s identity is never published without explicit consent. Sensitive tips are handled by senior editors only.',
  },
  {
    heading: 'Corrections & accountability',
    body: 'Every correction to a published story is dated and recorded on our corrections page. Serious errors carry a clear note on the story itself.',
  },
];

export default function StandardsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
        Trust &amp; safety
      </p>
      <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
        Editorial standards
      </h1>
      <p className="mt-3 font-body text-muted">
        The principles that govern our reporting. Hold us to them.
      </p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2 className="font-heading text-xl font-bold text-text">{s.heading}</h2>
            <p className="mt-2 font-body leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 font-mono text-xs uppercase tracking-wide">
        <Link href="/corrections" className="text-primary hover:underline">
          Corrections log →
        </Link>
        <Link href="/tips" className="text-primary hover:underline">
          Send a secure tip →
        </Link>
      </div>
    </div>
  );
}
