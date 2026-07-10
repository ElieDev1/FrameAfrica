import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — Frame Africa',
  description: 'How Frame Africa collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="10 July 2026"
      intro="This policy explains what information Frame Africa collects when you read, subscribe, or create an account, how we use it, and the choices you have. We aim to collect only what we need to run the service."
    >
      <LegalSection heading="Information we collect">
        <p>
          <strong className="text-text">Account data</strong> — your name and email when you create
          an account, and settings such as the sections you follow.
        </p>
        <p>
          <strong className="text-text">Usage data</strong> — pages you read and general device
          information, used to improve the experience and measure our reporting. Reader metering
          uses an opaque per-device identifier that contains no personal information.
        </p>
        <p>
          <strong className="text-text">Payment data</strong> — if you subscribe, payments are
          handled by our payment partners; we do not store full card or mobile-money credentials.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <p>
          To provide and secure your account, personalise your feed, send updates and offers you
          have asked for, and understand which stories matter to our readers. You can opt out of
          marketing email at any time from your account settings or the link in any message.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing">
        <p>
          We do not sell your personal data. We share it only with service providers who help us run
          Frame Africa (hosting, analytics, payments) under contract, or where the law requires it.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          We use essential cookies to keep you signed in and remember your preferences, and — with
          your consent — analytics cookies to understand usage. You can change your choice from the
          cookie banner at any time.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can access, correct, export, or delete your data from your account, or by contacting
          us. We keep personal data only as long as needed to provide the service and meet legal
          obligations.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          We protect your data with encryption in transit, hashed passwords, optional two-factor
          authentication, and access controls. No system is perfectly secure, but we work to keep
          your information safe.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
