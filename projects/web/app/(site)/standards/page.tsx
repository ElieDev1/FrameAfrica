import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from '@/lib/i18n-server';
import { type Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Editorial standards — Frame Africa',
  description: "Frame Africa's editorial standards, ethics, and right of reply.",
};

const CONTENT = {
  en: {
    trustSafety: 'Trust & safety',
    title: 'Editorial standards',
    subtitle: 'The principles that govern our reporting. Hold us to them.',
    sections: [
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
    ],
    correctionsLink: 'Corrections log →',
    tipsLink: 'Send a secure tip →',
  },
  rw: {
    trustSafety: 'Kwizera & umutekano',
    title: 'Amahame y’ubwanditsi',
    subtitle: 'Amashyirahamwe n’amahame agenga amakuru yacu. Turengere kuri yo.',
    sections: [
      {
        heading: 'Kuri mbere y’ukuri',
        body: 'Tugenzura ukuri mbere yo gutangaza. Aho ibintu bitavugwaho rumwe, turabivuga. Iyo twibeshye, turabikosora vuba kandi mu ruhame — reba ububiko bwacu bwo gukosora.',
      },
      {
        heading: 'Kwigenga',
        body: 'Umunyamakuru wacu ntacuruzwa. Kwamamaza no gufatanya mu bucuruzi ntibishobora guhindura amakuru, kandi ibyabaye byose byatewe inkunga byandikwaho neza.',
      },
      {
        heading: 'Ubutabera & uburenganzira bwo gusubiza',
        body: 'Umuntu wese unengwa mu makuru yacu ahabwa amahirwe yo gusubiza mbere yo gutangaza. Gushaka uburenganzira bwo gusubiza birandikwa kandi bigasuzumwa n’umwanditsi mukuru.',
      },
      {
        heading: 'Abatanga amakuru & iby’ibanga',
        body: 'Turinda abantu baduha amakuru mu buryo bw’ibanga. Umwirondoro w’uguhaye amakuru ntiwigeze utangazwa nta ruhushya rwe. Amakuru y’ibanga arebwa n’abanditsi bakuru gusa.',
      },
      {
        heading: 'Gukosora & kubazwa ibyakozwe',
        body: 'Gukosora kwose ku nkuru yatangajwe kugaragazwa n’itariki kandi kukandikwa ku rupapuro rwacu rwo gukosora. Amakosa akomeye andikwaho inyandiko isobanutse ku nkuru ubwayo.',
      },
    ],
    correctionsLink: 'Ibyakosowe →',
    tipsLink: 'Ohereza amakuru mu buryo bwizewe →',
  },
  fr: {
    trustSafety: 'Confiance & sécurité',
    title: 'Chartes éditoriales',
    subtitle: 'Les principes qui régissent notre journalisme. Tenez-nous-y.',
    sections: [
      {
        heading: 'L’exactitude d’abord',
        body: 'Nous vérifions avant de publier. Lorsque les faits sont contestés, nous le précisons. En cas d’erreur, nous la corrigeons rapidement et publiquement — voir notre journal des rectificatifs.',
      },
      {
        heading: 'Indépendance',
        body: 'Notre journalisme n’est pas à vendre. La publicité et les partenariats commerciaux n’influencent jamais le traitement de l’information, et tout contenu parrainé est clairement identifié.',
      },
      {
        heading: 'Équité & droit de réponse',
        body: 'Toute personne faisant l’objet de critiques importantes dans nos articles se voit offrir une opportunité équitable de répondre avant publication. Les demandes de droit de réponse sont consignées et examinées par un rédacteur en chef.',
      },
      {
        heading: 'Sources & de confidentialité',
        body: 'Nous protégeons les sources confidentielles. L’identité d’un informateur n’est jamais publiée sans son consentement explicite. Les informations sensibles sont traitées uniquement par les rédacteurs en chef.',
      },
      {
        heading: 'Corrections & responsabilité',
        body: 'Chaque rectification d’un article publié est datée et enregistrée sur notre page de corrections. Les erreurs graves font l’objet d’une note explicite sur l’article concerné.',
      },
    ],
    correctionsLink: 'Journal des corrections →',
    tipsLink: 'Transmettre une alerte sécurisée →',
  },
};

export default async function StandardsPage() {
  const locale = await getLocale();
  const c = CONTENT[locale as Locale] ?? CONTENT.en;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{c.trustSafety}</p>
      <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">{c.title}</h1>
      <p className="mt-3 font-body text-muted">{c.subtitle}</p>

      <div className="mt-8 space-y-8">
        {c.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-heading text-xl font-bold text-text">{s.heading}</h2>
            <p className="mt-2 font-body leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 font-mono text-xs uppercase tracking-wide">
        <Link href="/corrections" className="text-primary hover:underline">
          {c.correctionsLink}
        </Link>
        <Link href="/tips" className="text-primary hover:underline">
          {c.tipsLink}
        </Link>
      </div>
    </div>
  );
}
