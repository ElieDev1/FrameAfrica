import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'About — Frame Africa',
  description: 'Frame Africa is a modern, AI-assisted digital newspaper for Rwanda and Africa.',
};

export default function AboutPage() {
  return (
    <LegalPage
      title="About Frame Africa"
      updated="10 July 2026"
      intro="Frame Africa is a modern digital newspaper for Rwanda and the continent — independent reporting, live data, and a reading experience built around what matters to you. News. Views. Africa."
    >
      <LegalSection heading="What we do">
        <p>
          We cover the stories shaping Rwanda and Africa across news, business, technology, sport,
          culture, health, environment and more — with a newsroom that pairs careful editing with
          AI-assisted tools to work faster without cutting corners.
        </p>
      </LegalSection>
      <LegalSection heading="Our standards">
        <p>
          Accuracy and fairness come first. When we get something wrong we correct it openly — see
          our{' '}
          <Link href="/standards" className="text-primary hover:underline">
            editorial standards
          </Link>{' '}
          and{' '}
          <Link href="/corrections" className="text-primary hover:underline">
            corrections
          </Link>
          .
        </p>
      </LegalSection>
      <LegalSection heading="Work with us">
        <p>
          Want to reach our readers?{' '}
          <Link href="/advertise" className="text-primary hover:underline">
            Advertise with Frame Africa
          </Link>
          . Have a question or idea?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Get in touch
          </Link>
          . Have a confidential story?{' '}
          <Link href="/tips" className="text-primary hover:underline">
            Send a secure tip
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
