import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Use — Frame Africa',
  description: 'The terms that govern your use of Frame Africa.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="10 July 2026"
      intro="These terms govern your use of Frame Africa. By creating an account or continuing to use the service, you agree to them."
    >
      <LegalSection heading="Using Frame Africa">
        <p>
          You may read and share our journalism for personal, non-commercial use. You agree not to
          misuse the service — including attempting to disrupt it, access it without authorisation,
          or scrape content at scale without our written permission.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You are responsible for keeping your login credentials confidential and for activity under
          your account. Tell us promptly if you believe your account has been compromised. You must
          be old enough to consent to data processing in your country to create an account.
        </p>
      </LegalSection>

      <LegalSection heading="Subscriptions and payments">
        <p>
          Some content and features require a subscription. Prices, billing cycles, and cancellation
          terms are shown at purchase. Subscriptions renew until cancelled, and you can cancel at
          any time from your account.
        </p>
      </LegalSection>

      <LegalSection heading="Comments and contributions">
        <p>
          You are responsible for what you post. Keep it lawful and civil — no harassment, hate
          speech, or infringement of others&apos; rights. We may moderate, remove, or restrict
          content and accounts that breach these terms or our editorial standards.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual property">
        <p>
          Frame Africa and its contributors own the content on this service. Our name, logo, and
          articles are protected — you may not reproduce them commercially without permission.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers and changes">
        <p>
          The service is provided &ldquo;as is.&rdquo; We work to keep reporting accurate and the
          service available, but we do not guarantee it will be uninterrupted or error-free. We may
          update these terms; we will note the date above and, for significant changes, let you
          know.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
