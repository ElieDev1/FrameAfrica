import type { Metadata } from 'next';
import { StudioCanvas } from '@/components/studio/StudioCanvas';
import { requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Studio — Frame Africa' };

export default async function StudioPage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Studio</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Make branded social cards and flyers — pick a template, edit the text, and download a PNG to
        share. No external software needed.
      </p>

      <div className="mt-6">
        <StudioCanvas />
      </div>
    </div>
  );
}
