import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';
import { getLocale } from '@/lib/i18n-server';
import { type Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'About — Frame Africa',
  description: 'Frame Africa is a modern, AI-assisted digital newspaper for Rwanda and Africa.',
};

const CONTENT = {
  en: {
    title: 'About Frame Africa',
    updated: '10 July 2026',
    intro:
      'Frame Africa is a modern digital newspaper for Rwanda and the continent — independent reporting, live data, and a reading experience built around what matters to you. News. Views. Africa.',
    whatWeDo: 'What we do',
    whatWeDoBody:
      'We cover the stories shaping Rwanda and Africa across news, business, technology, sport, culture, health, environment and more — with a newsroom that pairs careful editing with AI-assisted tools to work faster without cutting corners.',
    ourStandards: 'Our standards',
    ourStandardsBody1:
      'Accuracy and fairness come first. When we get something wrong we correct it openly — see our ',
    ourStandardsBody2: 'editorial standards',
    ourStandardsBody3: ' and ',
    ourStandardsBody4: 'corrections',
    workWithUs: 'Work with us',
    workWithUsBody1: 'Want to reach our readers? ',
    workWithUsBody2: 'Advertise with Frame Africa',
    workWithUsBody3: '. Have a question or idea? ',
    workWithUsBody4: 'Get in touch',
    workWithUsBody5: '. Have a confidential story? ',
    workWithUsBody6: 'Send a secure tip',
  },
  rw: {
    title: 'Kuba Frame Africa',
    updated: '10 Nyakanga 2026',
    intro:
      "Frame Africa ni ikinyamakuru kigezweho cya dijitari cyo mu Rwanda no ku mugabane wa Afurika — gitangaza amakuru yigenga, amakuru y'imbonankubone, n'uburyo bwo gusoma bujyanye n'ibyo wifuza. Amakuru. Ibitekerezo. Afurika.",
    whatWeDo: 'Ibyo dukora',
    whatWeDoBody:
      "Turangurura inkuru zishingiye ku Rwanda na Afurika mu makuru, ubucuruzi, ikoranabuhanga, imikino, umuco, ubuzima, ibidukikije n'ibindi — dukoresheje urwandiko ruhuza ubugororangingo bufashijwe n'ikoranabuhanga rya AI kugira ngo dukore vuba tutabangamiye ubuziranenge.",
    ourStandards: 'Indangagaciro zacu',
    ourStandardsBody1:
      "Ukuri n'ubutabera nibyo bya mbere. Iyo twibeshye turabikosora mu ruhame — reba ",
    ourStandardsBody2: "amahame y'ubwanditsi",
    ourStandardsBody3: ' yacu hamwe no ',
    ourStandardsBody4: 'gukosora ibyabaye',
    workWithUs: 'Kora natwe',
    workWithUsBody1: 'Ushaka kugera ku basomyi bacu? ',
    workWithUsBody2: 'Kwamamaza na Frame Africa',
    workWithUsBody3: '. Ufite ikibazo cyangwa igitekerezo? ',
    workWithUsBody4: 'Twandikire',
    workWithUsBody5: ". Ufite inkuru y'ibanga? ",
    workWithUsBody6: 'Ohereza amakuru mu buryo bwizewe',
  },
  fr: {
    title: 'À propos de Frame Africa',
    updated: '10 juillet 2026',
    intro:
      'Frame Africa est un journal numérique moderne pour le Rwanda et le continent — un journalisme indépendant, des données en direct et une expérience de lecture conçue autour de ce qui vous importe. Actualités. Analyses. Afrique.',
    whatWeDo: 'Ce que nous faisons',
    whatWeDoBody:
      "Nous couvrons les actualités du Rwanda et de l'Afrique dans les domaines des affaires, de la technologie, des sports, de la culture, de la santé, de l'environnement, etc. — avec une rédaction alliant rigueur éditoriale et outils assistés par l'IA pour travailler plus vite sans compromis.",
    ourStandards: 'Nos normes',
    ourStandardsBody1:
      "L'exactitude et l'équité passent avant tout. En cas d'erreur, nous la corrigeons ouvertement — voir nos ",
    ourStandardsBody2: 'chartes éditoriales',
    ourStandardsBody3: ' et nos ',
    ourStandardsBody4: 'rectificatifs',
    workWithUs: 'Collaborer avec nous',
    workWithUsBody1: 'Vous souhaitez toucher nos lecteurs ? ',
    workWithUsBody2: 'Annoncer sur Frame Africa',
    workWithUsBody3: '. Une question ou une suggestion ? ',
    workWithUsBody4: 'Nous contacter',
    workWithUsBody5: '. Une information confidentielle ? ',
    workWithUsBody6: 'Transmettre une alerte sécurisée',
  },
};

export default async function AboutPage() {
  const locale = await getLocale();
  const c = CONTENT[locale as Locale] ?? CONTENT.en;

  return (
    <LegalPage title={c.title} updated={c.updated} intro={c.intro}>
      <LegalSection heading={c.whatWeDo}>
        <p>{c.whatWeDoBody}</p>
      </LegalSection>
      <LegalSection heading={c.ourStandards}>
        <p>
          {c.ourStandardsBody1}
          <Link href="/standards" className="text-primary hover:underline">
            {c.ourStandardsBody2}
          </Link>
          {c.ourStandardsBody3}
          <Link href="/corrections" className="text-primary hover:underline">
            {c.ourStandardsBody4}
          </Link>
          .
        </p>
      </LegalSection>
      <LegalSection heading={c.workWithUs}>
        <p>
          {c.workWithUsBody1}
          <Link href="/advertise" className="text-primary hover:underline">
            {c.workWithUsBody2}
          </Link>
          {c.workWithUsBody3}
          <Link href="/contact" className="text-primary hover:underline">
            {c.workWithUsBody4}
          </Link>
          {c.workWithUsBody5}
          <Link href="/tips" className="text-primary hover:underline">
            {c.workWithUsBody6}
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
