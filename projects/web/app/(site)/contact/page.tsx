import type { Metadata } from 'next';
import { InquiryForm } from '@/components/InquiryForm';

export const metadata: Metadata = {
  title: 'Contact — Frame Africa',
  description: 'Get in touch with the Frame Africa team.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Contact</p>
      <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">
        Get in touch
      </h1>
      <p className="mt-3 max-w-xl font-body text-lg leading-relaxed text-muted">
        Questions, feedback, corrections, or partnership ideas — send us a note and the right person
        will get back to you. For confidential story tips, use{' '}
        <a href="/tips" className="text-primary hover:underline">
          secure tips
        </a>{' '}
        instead.
      </p>

      <div className="mt-8">
        <InquiryForm type="contact" />
      </div>
    </div>
  );
}
