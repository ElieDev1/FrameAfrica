export const LOCALES = ['en', 'rw', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'fa-locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  rw: 'Kinyarwanda',
  fr: 'Français',
};

/**
 * UI strings. Each key carries all three languages together so the locales can
 * never drift apart. English is the source of truth; `t()` falls back to
 * English, then the key itself. Long-form content (articles, legal prose) is
 * authored content, not part of this static-string catalogue.
 */
const dict = {
  // — Common actions / labels —
  'common.save': { en: 'Save', rw: 'Bika', fr: 'Enregistrer' },
  'common.saving': { en: 'Saving…', rw: 'Kubika…', fr: 'Enregistrement…' },
  'common.cancel': { en: 'Cancel', rw: 'Kureka', fr: 'Annuler' },
  'common.delete': { en: 'Delete', rw: 'Siba', fr: 'Supprimer' },
  'common.edit': { en: 'Edit', rw: 'Hindura', fr: 'Modifier' },
  'common.add': { en: 'Add', rw: 'Ongeraho', fr: 'Ajouter' },
  'common.remove': { en: 'Remove', rw: 'Kuraho', fr: 'Retirer' },
  'common.publish': { en: 'Publish', rw: 'Tangaza', fr: 'Publier' },
  'common.unpublish': { en: 'Unpublish', rw: 'Kuraho', fr: 'Dépublier' },
  'common.draft': { en: 'Draft', rw: 'Umushinga', fr: 'Brouillon' },
  'common.published': { en: 'Published', rw: 'Byatangajwe', fr: 'Publié' },
  'common.loading': { en: 'Loading…', rw: 'Biratunganywa…', fr: 'Chargement…' },
  'common.submit': { en: 'Submit', rw: 'Ohereza', fr: 'Envoyer' },
  'common.sending': { en: 'Sending…', rw: 'Kohereza…', fr: 'Envoi…' },
  'common.close': { en: 'Close', rw: 'Funga', fr: 'Fermer' },
  'common.back': { en: 'Back', rw: 'Subira inyuma', fr: 'Retour' },
  'common.next': { en: 'Next', rw: 'Ikurikira', fr: 'Suivant' },
  'common.previous': { en: 'Previous', rw: 'Ibanjirije', fr: 'Précédent' },
  'common.search': { en: 'Search', rw: 'Shakisha', fr: 'Rechercher' },
  'common.viewAll': { en: 'View all', rw: 'Reba byose', fr: 'Voir tout' },
  'common.readMore': { en: 'Read more', rw: 'Soma byinshi', fr: 'Lire la suite' },
  'common.status': { en: 'Status', rw: 'Uko bihagaze', fr: 'Statut' },
  'common.title': { en: 'Title', rw: 'Umutwe', fr: 'Titre' },
  'common.description': { en: 'Description', rw: 'Ibisobanuro', fr: 'Description' },
  'common.actions': { en: 'Actions', rw: 'Ibikorwa', fr: 'Actions' },
  'common.new': { en: 'New', rw: 'Gishya', fr: 'Nouveau' },
  'common.all': { en: 'All', rw: 'Byose', fr: 'Tout' },
  'common.none': { en: 'None', rw: 'Nta na kimwe', fr: 'Aucun' },
  'common.optional': { en: 'optional', rw: 'bitegetswe', fr: 'facultatif' },
  'common.uploading': { en: 'Uploading…', rw: 'Kohereza…', fr: 'Téléversement…' },
  'common.upload': { en: 'Upload', rw: 'Ohereza', fr: 'Téléverser' },

  // — Header / navigation —
  'nav.forYou': { en: 'For You', rw: 'Ibyawe', fr: 'Pour vous' },
  'nav.signIn': { en: 'Sign in', rw: 'Injira', fr: 'Se connecter' },
  'nav.subscribe': { en: 'Subscribe', rw: 'Iyandikishe', fr: "S'abonner" },
  'nav.searchPlaceholder': { en: 'Search…', rw: 'Shakisha…', fr: 'Rechercher…' },
  'nav.searchAria': { en: 'Search articles', rw: 'Shakisha inkuru', fr: 'Rechercher des articles' },
  'nav.sections': { en: 'Sections', rw: 'Ibyiciro', fr: 'Rubriques' },
  'nav.multimedia': { en: 'Multimedia', rw: 'Multimedia', fr: 'Multimédia' },
  'nav.myAccount': { en: 'My account', rw: 'Konti yanjye', fr: 'Mon compte' },
  'nav.savedStories': { en: 'Saved stories', rw: 'Inkuru wabitse', fr: 'Articles enregistrés' },
  'nav.accountSecurity': {
    en: 'Account & security',
    rw: 'Konti n’umutekano',
    fr: 'Compte et sécurité',
  },
  'nav.newsroomDashboard': {
    en: 'Newsroom dashboard',
    rw: 'Ikibaho cy’abanyamakuru',
    fr: 'Tableau de bord',
  },
  'nav.signOut': { en: 'Sign out', rw: 'Sohoka', fr: 'Se déconnecter' },
  'nav.menu': { en: 'Menu', rw: 'Menu', fr: 'Menu' },

  // — Multimedia hubs (nav + page kickers) —
  'mm.videos': { en: 'Videos', rw: 'Amashusho', fr: 'Vidéos' },
  'mm.galleries': { en: 'Photo galleries', rw: 'Amafoto', fr: 'Galeries photo' },
  'mm.podcasts': { en: 'Podcasts', rw: 'Podcasts', fr: 'Podcasts' },
  'mm.interactives': {
    en: 'Data & interactives',
    rw: 'Imibare n’ibikoresho',
    fr: 'Données et interactifs',
  },
  'mm.videosSub': {
    en: 'Reporting, explainers and interviews from the Frame Africa newsroom.',
    rw: 'Raporo, ibisobanuro n’ibiganiro biva mu banyamakuru ba Frame Africa.',
    fr: 'Reportages, explications et entretiens de la rédaction Frame Africa.',
  },
  'mm.galleriesSub': {
    en: 'Visual stories and photojournalism from Rwanda and across the continent.',
    rw: 'Inkuru z’amashusho n’ubufotozi buva mu Rwanda no ku mugabane wose.',
    fr: 'Histoires visuelles et photojournalisme du Rwanda et du continent.',
  },
  'mm.podcastsSub': {
    en: 'Audio and video shows from the Frame Africa newsroom.',
    rw: 'Porogaramu z’amajwi n’amashusho biva mu banyamakuru ba Frame Africa.',
    fr: 'Émissions audio et vidéo de la rédaction Frame Africa.',
  },
  'mm.interactivesSub': {
    en: 'Charts, maps and interactive graphics from the Frame Africa data desk.',
    rw: 'Imbonerahamwe, amakarita n’ibishushanyo biva ku biro by’imibare bya Frame Africa.',
    fr: 'Graphiques, cartes et infographies interactives de Frame Africa.',
  },
  'mm.empty': {
    en: 'Nothing published yet.',
    rw: 'Nta kintu kirasohoka.',
    fr: 'Rien de publié pour le moment.',
  },

  // — Footer —
  'footer.tagline': {
    en: 'Independent journalism from Kigali for the continent and its diaspora.',
    rw: 'Itangazamakuru ryigenga rivuye i Kigali ku mugabane no mu banyamahanga.',
    fr: 'Journalisme indépendant depuis Kigali pour le continent et sa diaspora.',
  },
  'footer.language': { en: 'Language', rw: 'Ururimi', fr: 'Langue' },
  'footer.company': { en: 'Company', rw: 'Ikigo', fr: 'Entreprise' },
  'footer.read': { en: 'Read', rw: 'Soma', fr: 'Lire' },
  'footer.legal': { en: 'Legal', rw: 'Amategeko', fr: 'Mentions légales' },
  'footer.aboutUs': { en: 'About us', rw: 'Abo turi bo', fr: 'À propos' },
  'footer.advertise': { en: 'Advertise', rw: 'Kwamamaza', fr: 'Publicité' },
  'footer.contact': { en: 'Contact', rw: 'Twandikire', fr: 'Contact' },
  'footer.sendTip': { en: 'Send a tip', rw: 'Ohereza inkuru', fr: 'Proposer une info' },
  'footer.latest': { en: 'Latest', rw: 'Bishya', fr: 'À la une' },
  'footer.search': { en: 'Search', rw: 'Shakisha', fr: 'Recherche' },
  'footer.privacy': { en: 'Privacy', rw: 'Ubuzima bwite', fr: 'Confidentialité' },
  'footer.terms': { en: 'Terms', rw: 'Amabwiriza', fr: 'Conditions' },
  'footer.standards': {
    en: 'Editorial standards',
    rw: 'Amahame y’ubwanditsi',
    fr: 'Charte éditoriale',
  },
  'footer.corrections': { en: 'Corrections', rw: 'Ibikosorwa', fr: 'Corrections' },
  'footer.rights': {
    en: 'Media Ltd · Kigali, Rwanda',
    rw: 'Media Ltd · Kigali, u Rwanda',
    fr: 'Media Ltd · Kigali, Rwanda',
  },

  // — Homepage sections —
  'home.mostRead': { en: 'Most read', rw: 'Bisomwa cyane', fr: 'Les plus lus' },
  'home.editorsPicks': {
    en: "Editor's picks",
    rw: 'Ibyatoranyijwe',
    fr: 'Sélection de la rédaction',
  },
  'home.watch': { en: 'Watch', rw: 'Reba', fr: 'À regarder' },
  'home.listen': { en: 'Listen', rw: 'Umva', fr: 'À écouter' },
  'home.breaking': { en: 'Breaking', rw: 'Inkuru ihuse', fr: 'Dernière minute' },
  'home.weather': { en: 'Weather', rw: 'Ikirere', fr: 'Météo' },
  'home.markets': { en: 'Markets', rw: 'Isoko', fr: 'Marchés' },

  // — Article —
  'article.by': { en: 'By', rw: 'Byanditswe na', fr: 'Par' },
  'article.updated': { en: 'Updated', rw: 'Byavuguruwe', fr: 'Mis à jour' },
  'article.minRead': { en: 'min read', rw: 'iminota yo gusoma', fr: 'min de lecture' },
  'article.listen': { en: 'Listen', rw: 'Umva', fr: 'Écouter' },
  'article.save': { en: 'Save', rw: 'Bika', fr: 'Enregistrer' },
  'article.saved': { en: 'Saved', rw: 'Byabitswe', fr: 'Enregistré' },
  'article.share': { en: 'Share', rw: 'Sangiza', fr: 'Partager' },
  'article.related': { en: 'Related stories', rw: 'Inkuru zisa', fr: 'Articles liés' },
  'article.sources': { en: 'Sources', rw: 'Aho byavuye', fr: 'Sources' },
  'article.correction': { en: 'Correction', rw: 'Igikosorwa', fr: 'Correction' },
  'article.developing': { en: 'Developing', rw: 'Iracyakomeza', fr: 'En cours' },
  'article.live': { en: 'Live', rw: 'Ikiriho', fr: 'En direct' },
  'article.premium': { en: 'Premium', rw: 'Premium', fr: 'Premium' },

  // — Comments —
  'comments.title': { en: 'Comments', rw: 'Ibitekerezo', fr: 'Commentaires' },
  'comments.placeholder': {
    en: 'Add a comment…',
    rw: 'Andika igitekerezo…',
    fr: 'Ajouter un commentaire…',
  },
  'comments.post': { en: 'Post', rw: 'Ohereza', fr: 'Publier' },
  'comments.reply': { en: 'Reply', rw: 'Subiza', fr: 'Répondre' },
  'comments.report': { en: 'Report', rw: 'Tanga ikirego', fr: 'Signaler' },
  'comments.signIn': {
    en: 'Sign in to comment',
    rw: 'Injira kugira ngo utange igitekerezo',
    fr: 'Connectez-vous pour commenter',
  },
  'comments.empty': {
    en: 'No comments yet. Be the first.',
    rw: 'Nta bitekerezo birahaba. Ba uwa mbere.',
    fr: 'Aucun commentaire. Soyez le premier.',
  },

  // — Newsletter box —
  'newsletter.title': { en: 'The newsletter', rw: 'Inyandiko y’amakuru', fr: 'La newsletter' },
  'newsletter.subtitle': {
    en: 'The day’s essential stories, in your inbox.',
    rw: 'Inkuru z’ingenzi z’umunsi, muri email yawe.',
    fr: 'L’essentiel de l’actualité, dans votre boîte mail.',
  },
  'newsletter.emailPlaceholder': {
    en: 'Your email address',
    rw: 'Aderesi email yawe',
    fr: 'Votre adresse e-mail',
  },
  'newsletter.subscribe': { en: 'Subscribe', rw: 'Iyandikishe', fr: "S'abonner" },
  'newsletter.subscribed': {
    en: 'You’re subscribed — thank you.',
    rw: 'Wanditse — murakoze.',
    fr: 'Vous êtes abonné — merci.',
  },

  // — Cookie consent —
  'consent.message': {
    en: 'We use cookies to keep you signed in and remember your preferences.',
    rw: 'Dukoresha cookies kugira ngo tugume tukwinjije no kwibuka amahitamo yawe.',
    fr: 'Nous utilisons des cookies pour vous garder connecté et mémoriser vos préférences.',
  },
  'consent.accept': { en: 'Accept', rw: 'Emera', fr: 'Accepter' },
  'consent.decline': { en: 'Decline', rw: 'Anga', fr: 'Refuser' },
  'consent.privacyNotice': {
    en: 'privacy notice',
    rw: 'itangazo ry’ubuzima bwite',
    fr: 'politique de confidentialité',
  },

  // — Search page —
  'search.title': { en: 'Search', rw: 'Shakisha', fr: 'Recherche' },
  'search.noResults': { en: 'No results found.', rw: 'Nta cyabonetse.', fr: 'Aucun résultat.' },
  'search.resultsFor': { en: 'Results for', rw: 'Ibisubizo bya', fr: 'Résultats pour' },

  // — Auth —
  'auth.signIn': { en: 'Sign in', rw: 'Injira', fr: 'Se connecter' },
  'auth.signUp': { en: 'Create account', rw: 'Fungura konti', fr: 'Créer un compte' },
  'auth.email': { en: 'Email', rw: 'Email', fr: 'E-mail' },
  'auth.password': { en: 'Password', rw: 'Ijambobanga', fr: 'Mot de passe' },
  'auth.confirmPassword': {
    en: 'Confirm password',
    rw: 'Emeza ijambobanga',
    fr: 'Confirmer le mot de passe',
  },
  'auth.name': { en: 'Full name', rw: 'Amazina yombi', fr: 'Nom complet' },
  'auth.forgotPassword': {
    en: 'Forgot password?',
    rw: 'Wibagiwe ijambobanga?',
    fr: 'Mot de passe oublié ?',
  },
  'auth.continueGoogle': {
    en: 'Continue with Google',
    rw: 'Komeza na Google',
    fr: 'Continuer avec Google',
  },
  'auth.continueApple': {
    en: 'Continue with Apple',
    rw: 'Komeza na Apple',
    fr: 'Continuer avec Apple',
  },
  'auth.orEmail': {
    en: 'or continue with email',
    rw: 'cyangwa ukomeze na email',
    fr: 'ou continuer par e-mail',
  },
  'auth.noAccount': { en: 'No account?', rw: 'Nta konti ufite?', fr: 'Pas de compte ?' },
  'auth.haveAccount': {
    en: 'Already have an account?',
    rw: 'Usanzwe ufite konti?',
    fr: 'Déjà un compte ?',
  },
  'auth.sendResetLink': {
    en: 'Send reset link',
    rw: 'Ohereza umuyoboro wo guhindura',
    fr: 'Envoyer le lien',
  },

  // — Account page —
  'account.saved': { en: 'Saved', rw: 'Byabitswe', fr: 'Enregistrés' },
  'account.recentlyRead': { en: 'Recently read', rw: 'Wasomye vuba', fr: 'Lus récemment' },
  'account.following': { en: 'Following', rw: 'Ukurikira', fr: 'Abonnements' },
  'account.editProfile': {
    en: 'Edit profile',
    rw: 'Hindura umwirondoro',
    fr: 'Modifier le profil',
  },
  'account.security': { en: 'Security', rw: 'Umutekano', fr: 'Sécurité' },

  // — Dashboard chrome —
  'dash.welcome': { en: 'Welcome back', rw: 'Murakaza neza', fr: 'Bon retour' },
  'dash.newStory': { en: 'New story', rw: 'Inkuru nshya', fr: 'Nouvel article' },
  'dash.searchArticles': {
    en: 'Search articles…',
    rw: 'Shakisha inkuru…',
    fr: 'Rechercher des articles…',
  },
  'dash.notifications': { en: 'Notifications', rw: 'Amamenyesha', fr: 'Notifications' },
  'dash.markAllRead': { en: 'Mark all read', rw: 'Menya byose', fr: 'Tout marquer comme lu' },
  'dash.caughtUp': {
    en: 'You’re all caught up.',
    rw: 'Nta gishya gisigaye.',
    fr: 'Vous êtes à jour.',
  },
  // Dashboard nav section headings
  'dash.sec.newsroom': { en: 'Newsroom', rw: 'Inzu y’amakuru', fr: 'Rédaction' },
  'dash.sec.editorial': { en: 'Editorial desk', rw: 'Ibiro by’ubwanditsi', fr: 'Bureau éditorial' },
  'dash.sec.media': { en: 'Media', rw: 'Itangazamakuru', fr: 'Médias' },
  'dash.sec.audience': { en: 'Audience', rw: 'Abakurikira', fr: 'Audience' },
  'dash.sec.admin': { en: 'Administration', rw: 'Ubuyobozi', fr: 'Administration' },
  // Dashboard nav items
  'dash.overview': { en: 'Overview', rw: 'Incamake', fr: "Vue d'ensemble" },
  'dash.myStories': { en: 'My stories', rw: 'Inkuru zanjye', fr: 'Mes articles' },
  'dash.analytics': { en: 'Analytics', rw: 'Isesengura', fr: 'Statistiques' },
  'dash.copyDesk': { en: 'Copy desk', rw: 'Ibiro byo gukosora', fr: 'Secrétariat de rédaction' },
  'dash.reviewQueue': { en: 'Review queue', rw: 'Urutonde rwo gusuzuma', fr: 'File de relecture' },
  'dash.pipeline': { en: 'Pipeline', rw: 'Umurongo w’akazi', fr: 'Flux de production' },
  'dash.moderation': { en: 'Moderation', rw: 'Ugenzura', fr: 'Modération' },
  'dash.tipsInbox': { en: 'Tips inbox', rw: 'Ububiko bw’amakuru', fr: 'Boîte à infos' },
  'dash.mediaLibrary': { en: 'Media library', rw: 'Ububiko bw’amashusho', fr: 'Médiathèque' },
  'dash.studio': { en: 'Studio', rw: 'Studio', fr: 'Studio' },
  'dash.inquiries': { en: 'Inquiries', rw: 'Ibibazo', fr: 'Demandes' },
  'dash.newsletter': { en: 'Newsletter', rw: 'Inyandiko y’amakuru', fr: 'Newsletter' },
  'dash.allArticles': { en: 'All articles', rw: 'Inkuru zose', fr: 'Tous les articles' },
  'dash.taxonomy': { en: 'Taxonomy', rw: 'Ibyiciro', fr: 'Taxonomie' },
  'dash.houseAds': { en: 'House ads', rw: 'Kwamamaza', fr: 'Publicités maison' },
  'dash.users': { en: 'Users & roles', rw: 'Abakoresha n’inshingano', fr: 'Utilisateurs et rôles' },
  'dash.monitor': { en: 'Monitor', rw: 'Ugukurikirana', fr: 'Supervision' },
  'dash.auditLog': { en: 'Audit log', rw: 'Ibyakozwe', fr: 'Journal d’audit' },
  'dash.settings': { en: 'Settings', rw: 'Igenamiterere', fr: 'Paramètres' },
  'dash.viewSite': { en: 'View site', rw: 'Reba urubuga', fr: 'Voir le site' },
  'dash.myAccount': { en: 'My account', rw: 'Konti yanjye', fr: 'Mon compte' },
  'dash.signOut': { en: 'Sign out', rw: 'Sohoka', fr: 'Se déconnecter' },
  'dash.openMenu': { en: 'Open menu', rw: 'Fungura menu', fr: 'Ouvrir le menu' },
} as const;

export type MessageKey = keyof typeof dict;

/** Translate a key for a locale, falling back to English then the key itself. */
export function t(locale: Locale, key: MessageKey): string {
  const entry = dict[key];
  return entry?.[locale] ?? entry?.en ?? key;
}

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'rw' || value === 'fr';
}
