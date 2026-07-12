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
  'common.optional': { en: 'optional', rw: 'si ngombwa', fr: 'facultatif' },
  'common.uploading': { en: 'Uploading…', rw: 'Kohereza…', fr: 'Téléversement…' },
  'common.upload': { en: 'Upload', rw: 'Ohereza', fr: 'Téléverser' },
  'common.pleaseWait': { en: 'Please wait…', rw: 'Tegereza gato…', fr: 'Veuillez patienter…' },
  'common.backToHome': {
    en: 'Back to home →',
    rw: 'Subira ahabanza →',
    fr: 'Retour à l’accueil →',
  },
  'common.backToAccount': { en: '← Account', rw: '← Konti', fr: '← Compte' },
  'common.loadMoreStories': {
    en: 'Load more stories',
    rw: 'Izindi nkuru',
    fr: 'Charger plus d’articles',
  },
  'common.loadMoreError': {
    en: "Couldn't load more — try again.",
    rw: 'Ntabwo byashobonye — ongera ugerageze.',
    fr: 'Impossible de charger plus — réessayez.',
  },

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
    rw: 'Ikibaho cy’ubwanditsi',
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
    rw: 'Raporo, ibisobanuro n’ibiganiro biva mu bwanditsi bwa Frame Africa.',
    fr: 'Reportages, explications et entretiens de la rédaction Frame Africa.',
  },
  'mm.galleriesSub': {
    en: 'Visual stories and photojournalism from Rwanda and across the continent.',
    rw: 'Inkuru z’amashusho n’ubufotozi buva mu Rwanda no ku mugabane wose.',
    fr: 'Histoires visuelles et photojournalisme du Rwanda et du continent.',
  },
  'mm.podcastsSub': {
    en: 'Audio and video shows from the Frame Africa newsroom.',
    rw: 'Porogaramu z’amajwi n’amashusho biva mu bwanditsi bwa Frame Africa.',
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
  'mm.emptyHint': {
    en: 'Check back soon — the newsroom publishes here regularly.',
    rw: 'Garuka vuba — abanyamakuru batangaza hano kenshi.',
    fr: 'Revenez bientôt — la rédaction publie ici régulièrement.',
  },
  'mm.latest': { en: 'Latest', rw: 'Ibiheruka', fr: 'À la une' },
  'mm.more': { en: 'More', rw: 'Ibindi', fr: 'Plus' },
  'mm.allVideos': { en: 'All videos', rw: 'Amashusho yose', fr: 'Toutes les vidéos' },
  'mm.upNext': { en: 'Up next', rw: 'Ibikurikira', fr: 'À suivre' },
  'mm.nowPlaying': { en: 'Now playing', rw: 'Birimo gukina', fr: 'En lecture' },
  'mm.play': { en: 'Play', rw: 'Kina', fr: 'Lire' },
  'pod.kicker': { en: 'Podcast', rw: 'Podcast', fr: 'Podcast' },
  'pod.episodes': { en: 'Episodes', rw: 'Ibice', fr: 'Épisodes' },
  'pod.episode': { en: 'episode', rw: 'igice', fr: 'épisode' },
  'pod.noEpisodes': {
    en: 'No episodes yet.',
    rw: 'Nta bice birahaba.',
    fr: 'Aucun épisode pour le moment.',
  },
  'pod.ep': { en: 'Ep', rw: 'Igice', fr: 'Ép' },
  'pod.listenOn': { en: 'Listen on', rw: 'Umva kuri', fr: 'Écouter sur' },
  'gal.kicker': { en: 'Photo gallery', rw: 'Amafoto', fr: 'Galerie photo' },
  'gal.photos': { en: 'photos', rw: 'amafoto', fr: 'photos' },
  'gal.by': { en: 'By', rw: 'Byakozwe na', fr: 'Par' },
  'gal.noPhotos': {
    en: 'This gallery has no photos yet.',
    rw: 'Aya mafoto ntaracyabamo.',
    fr: 'Cette galerie ne contient pas encore de photos.',
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
  'home.latest': { en: 'Latest', rw: 'Ibiheruka', fr: 'À la une' },
  'home.topStories': { en: 'Top stories', rw: 'Inkuru z’ingenzi', fr: 'À la une' },
  'home.moreSoon': {
    en: 'More stories coming soon.',
    rw: 'Izindi nkuru ziraza vuba.',
    fr: 'D’autres articles à venir.',
  },
  'home.breakingNews': { en: 'Breaking news', rw: 'Amakuru ahuse', fr: 'Info dernière minute' },
  'home.viewAll': { en: 'View all', rw: 'Reba byose', fr: 'Voir tout' },
  'home.errTitle': {
    en: 'News is taking a short break',
    rw: 'Amakuru afashe akaruhuko gato',
    fr: 'L’actualité fait une courte pause',
  },
  'home.noStories': {
    en: 'No stories yet',
    rw: 'Nta nkuru zirahaba',
    fr: 'Aucun article pour le moment',
  },
  'home.errBody': {
    en: 'We could not reach the newsroom just now. Please try again shortly.',
    rw: 'Ntitwashoboye kugera ku banyamakuru ubu. Ongera ugerageze vuba.',
    fr: 'Impossible de joindre la rédaction pour le moment. Veuillez réessayer bientôt.',
  },
  'home.noStoriesBody': {
    en: 'Published stories will appear here as the newsroom starts publishing.',
    rw: 'Inkuru zatangajwe zizagaragara hano igihe abanyamakuru batangiye gutangaza.',
    fr: 'Les articles publiés apparaîtront ici dès que la rédaction commencera à publier.',
  },
  'home.srLatestNews': {
    en: 'Frame Africa — latest news',
    rw: 'Frame Africa — amakuru aheruka',
    fr: 'Frame Africa — actualités récentes',
  },
  'widgets.weatherUnavailable': {
    en: 'Weather is unavailable right now.',
    rw: 'Amakuru y’ikirere ntaboneka ubu.',
    fr: 'La météo est indisponible pour le moment.',
  },
  'widgets.marketsUnavailable': {
    en: 'Markets are unavailable right now.',
    rw: 'Amakuru y’isoko ntaboneka ubu.',
    fr: 'Les marchés sont indisponibles pour le moment.',
  },
  'widgets.live': { en: 'live', rw: 'ako kanya', fr: 'en direct' },

  // — Ads —
  'ad.advertisement': { en: 'Advertisement', rw: 'Kwamamaza', fr: 'Publicité' },
  'ad.advertiseWith': {
    en: 'Advertise with Frame Africa',
    rw: 'Kwamamaza kuri Frame Africa',
    fr: 'Faire de la publicité avec Frame Africa',
  },

  // — Share (share.copyLink/byEmail/label defined below with the reader-page keys) —
  'share.copied': { en: 'Copied', rw: 'Byakoporowe', fr: 'Copié' },
  'share.on': {
    en: 'Share on {provider}',
    rw: 'Sangiza kuri {provider}',
    fr: 'Partager sur {provider}',
  },

  // — Newsletter box —
  'nlbox.title': { en: 'The Daily Frame', rw: 'The Daily Frame', fr: 'The Daily Frame' },
  'nlbox.subtitle': {
    en: 'The day’s essential stories, in your inbox each morning.',
    rw: 'Inkuru z’ingenzi z’umunsi, muri email yawe buri gitondo.',
    fr: 'L’essentiel de l’actualité, chaque matin dans votre boîte mail.',
  },
  'nlbox.emailAria': { en: 'Email address', rw: 'Aderesi email', fr: 'Adresse e-mail' },
  'nlbox.unsubscribeAnytime': {
    en: 'Unsubscribe anytime.',
    rw: 'Wakwikura igihe cyose.',
    fr: 'Désabonnement à tout moment.',
  },
  'nlbox.subscribedSuccess': {
    en: "You're subscribed. Welcome to The Daily Frame.",
    rw: 'Wanditswe. Murakaza neza kuri The Daily Frame.',
    fr: 'Vous êtes abonné. Bienvenue sur The Daily Frame.',
  },

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
    en: 'Add to the conversation…',
    rw: 'Sangiza igitekerezo…',
    fr: 'Ajouter à la conversation…',
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
  'comments.toJoin': {
    en: ' to join the conversation.',
    rw: ' kugira ngo utange igitekerezo.',
    fr: ' pour participer à la conversation.',
  },
  'comments.posting': { en: 'Posting…', rw: 'Biroherezwa…', fr: 'Envoi…' },
  'comments.postedSuccess': { en: 'Posted ✓', rw: 'Byoherejwe ✓', fr: 'Publié ✓' },
  'comments.unlike': { en: 'Unlike', rw: 'Kuraho gukunda', fr: 'Ne plus aimer' },
  'comments.like': { en: 'Like', rw: 'Gukunda', fr: 'Aimer' },
  'comments.reported': { en: 'Reported', rw: 'Byaregewe', fr: 'Signalé' },

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
  'newsletter.subscribing': { en: 'Subscribing…', rw: 'Kwiyandikisha…', fr: 'Inscription…' },
  'newsletter.subscribed': {
    en: 'You’re subscribed — thank you.',
    rw: 'Wiyandikishije — murakoze.',
    fr: 'Vous êtes abonné — merci.',
  },

  // — Cookie consent —
  'consent.message': {
    en: 'We use cookies to keep you signed in and remember your preferences.',
    rw: 'Dukoresha cookies kugira ngo ugume winjiye no kwibuka amahitamo yawe.',
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
    rw: 'Ohereza link yo guhindura',
    fr: 'Envoyer le lien',
  },
  'auth.soon': { en: 'Soon', rw: 'Vuba', fr: 'Bientôt' },
  'auth.continueWith': {
    en: 'Continue with {provider} — coming soon',
    rw: 'Komeza na {provider} — biraza vuba',
    fr: 'Continuer avec {provider} — bientôt disponible',
  },
  'auth.securedWithEncrypted': {
    en: 'Secured with encrypted sessions.',
    rw: 'Byarindishijwe uburyo bwo gufunga bwizewe.',
    fr: 'Sécurisé avec des sessions chiffrées.',
  },
  'auth.agreeTerms': {
    en: 'By continuing, you agree to our Terms of Use & Privacy Policy. We may email you updates — opt out anytime.',
    rw: 'Gukomeza bivuze ko wemera Amabwiriza n’Ubuzima Bwite byacu. Twaguhereza amakuru kuri email — ushobora kubihagarika igihe cyose.',
    fr: 'En continuant, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité. Nous pouvons vous envoyer des e-mails — désabonnez-vous à tout moment.',
  },
  'auth.shapingContinent': {
    en: 'The stories shaping ',
    rw: 'Inkuru zigaragaza isura y’',
    fr: 'Les histoires qui façonnent ',
  },
  'auth.shapingContinentBold': { en: 'a continent', rw: 'umugabane', fr: 'un continent' },
  'auth.joinFrameAfricaDescription': {
    en: 'Join Frame Africa for independent reporting, live data, and a reading experience built around what matters to you.',
    rw: 'Iyandikishe kuri Frame Africa ubone amakuru yigenga, imibare ya live, n’uburyo bwo gusoma buhuye n’ibyo ukunda.',
    fr: 'Rejoignez Frame Africa pour des reportages indépendants, des données en direct et une expérience de lecture adaptée à vos centres d’intérêt.',
  },
  'auth.joinFrameAfrica': {
    en: 'Join Frame Africa',
    rw: 'Iyandikishe kuri Frame Africa',
    fr: 'Rejoindre Frame Africa',
  },
  'auth.storiesPublished': {
    en: 'stories published',
    rw: 'inkuru zashizwe hanze',
    fr: 'articles publiés',
  },
  'auth.capitalsLive': {
    en: 'capitals, live',
    rw: 'imijyi mikuru, live',
    fr: 'capitales, en direct',
  },
  'auth.independentJournalism': {
    en: 'Independent journalism',
    rw: 'Itangazamakuru ryigenga',
    fr: 'Journalisme indépendant',
  },
  'auth.independentJournalismBody': {
    en: 'Verified reporting from Rwanda and across the continent.',
    rw: 'Inkuru zagenzuwe ziva mu Rwanda no ku mugabane wose.',
    fr: 'Reportages vérifiés du Rwanda et de tout le continent.',
  },
  'auth.feedBuiltForYou': {
    en: 'A feed built for you',
    rw: 'Gahunda yateguriwe wowe',
    fr: 'Un flux conçu pour vous',
  },
  'auth.feedBuiltForYouBody': {
    en: 'Briefings tuned to the sections you follow.',
    rw: 'Amakuru ahuye n’ibice ukurikira.',
    fr: 'Des synthèses adaptées aux rubriques que vous suivez.',
  },
  'auth.saveAndFollow': { en: 'Save & follow', rw: 'Bika & Kurikira', fr: 'Enregistrer et suivre' },
  'auth.saveAndFollowBody': {
    en: 'Bookmark stories and keep the threads you care about.',
    rw: 'Bika inkuru kandi ugume ubona izo wifuza.',
    fr: 'Enregistrez des articles et suivez les sujets qui vous intéressent.',
  },
  'auth.liveAcrossAfrica': {
    en: 'Live across Africa',
    rw: 'Live muri Afurika',
    fr: 'En direct d’Afrique',
  },
  'auth.liveAcrossAfricaBody': {
    en: 'Real-time markets and weather from four capitals.',
    rw: 'Amakuru y’isoko n’ikirere by’ako kanya biva mu mijyi mikuru ine.',
    fr: 'Les marchés et la météo en temps réel depuis quatre capitales.',
  },
  'auth.newHere': { en: 'New here?', rw: 'Uri mushya hano?', fr: 'Nouveau ici ?' },
  'auth.signInSubtitle': {
    en: 'Pick up where you left off across Frame Africa.',
    rw: 'Komeza aho wari ugeze kuri Frame Africa.',
    fr: 'Retrouvez votre lecture sur Frame Africa.',
  },
  'auth.createAccountSubtitle': {
    en: 'Join Frame Africa to start saving stories and customizing your feed.',
    rw: 'Iyandikishe kuri Frame Africa kugira ngo ubitswe inkuru kandi uhitemo ibyo ukurikira.',
    fr: 'Rejoignez Frame Africa pour enregistrer des articles et personnaliser votre flux.',
  },
  'auth.emailCodeSubtitle': {
    en: 'Enter the 6-digit code from your authenticator app.',
    rw: 'Andika nimero 6 zo mu kinyamakuru cyawe cy’umutekano (authenticator app).',
    fr: 'Saisissez le code à 6 chiffres de votre application d’authentification.',
  },
  'auth.twoFactorCode': {
    en: 'Authentication code',
    rw: 'Kode y’umutekano',
    fr: 'Code d’authentification',
  },
  'auth.verifySignIn': {
    en: 'Verify & sign in',
    rw: 'Emeza & Injira',
    fr: 'Vérifier et se connecter',
  },
  'auth.dismiss': { en: 'Dismiss', rw: 'Kuraho', fr: 'Ignorer' },
  'auth.accountRecovery': {
    en: 'Account recovery',
    rw: 'Gugarura konti',
    fr: 'Récupération de compte',
  },
  'auth.rememberedIt': { en: 'Remembered it?', rw: 'Wabyibutse?', fr: 'Vous vous en souvenez ?' },
  'auth.backToSignIn': {
    en: 'Back to sign in',
    rw: 'Subira ahabanza',
    fr: 'Retour à la connexion',
  },
  'auth.invalidResetLink': { en: 'Invalid reset link', rw: 'Link itari yo', fr: 'Lien invalide' },
  'auth.missingTokenSubtitle': {
    en: 'This link is missing its token — request a fresh one to continue.',
    rw: 'Iyi link nta token irimo — saba indi nshya kugira ngo ukomeze.',
    fr: 'Ce lien ne contient pas de jeton — demandez-en un nouveau pour continuer.',
  },
  'auth.resetLinksExpireNotice': {
    en: 'For your security, reset links expire after a short time. Start again and we’ll email you a new one.',
    rw: 'Ku bw’umutekano wawe, link zo guhindura ijambobanga zirangira nyuma y’igihe gito. Ongera utangire maze tukoherereze indi nshya.',
    fr: 'Pour votre sécurité, les liens de réinitialisation expirent rapidement. Recommencez et nous vous en enverrons un nouveau.',
  },
  'auth.chooseNewPassword': {
    en: 'Choose a new password',
    rw: 'Hitamo ijambobanga rishya',
    fr: 'Choisir un nouveau mot de passe',
  },
  'auth.chooseNewPasswordSubtitle': {
    en: "Pick something at least 8 characters long. You'll be signed out everywhere else.",
    rw: 'Hitamo icyubatswe n’inyuguti zitari munsi ya 8. Urasohorwa ahandi hose.',
    fr: 'Choisissez un mot de passe d’au moins 8 caractères. Vous serez déconnecté partout ailleurs.',
  },
  'auth.newPassword': { en: 'New password', rw: 'Ijambobanga rishya', fr: 'Nouveau mot de passe' },
  'auth.confirmNewPassword': {
    en: 'Confirm new password',
    rw: 'Emeza ijambobanga rishya',
    fr: 'Confirmer le nouveau mot de passe',
  },
  'auth.setPasswordAndContinue': {
    en: 'Set password & continue',
    rw: 'Bika ijambobanga & Komeza',
    fr: 'Enregistrer et continuer',
  },
  'auth.allSet': { en: 'All set', rw: 'Byarangiye', fr: 'Tout est prêt' },
  'auth.emailVerified': { en: 'Email verified', rw: 'Email yemejwe', fr: 'E-mail vérifié' },
  'auth.emailVerifiedSubtitle': {
    en: 'Thanks — your email is confirmed and your account is ready.',
    rw: 'Murakoze — email yanyu yemejwe kandi konti yanyu yiteguye.',
    fr: 'Merci — votre e-mail est confirmé et votre compte est prêt.',
  },
  'auth.goToAccount': {
    en: 'Go to your account',
    rw: 'Jya kuri konti yawe',
    fr: 'Aller à votre compte',
  },
  'auth.verificationExpired': {
    en: 'Verification link expired',
    rw: 'Link yo kwemeza yarenze igihe',
    fr: 'Lien de vérification expiré',
  },
  'auth.verificationExpiredSubtitle': {
    en: 'This link is invalid or has already been used. Sign in and we can send you a fresh one.',
    rw: 'Iyi link ntikora cyangwa yakoreshejwe. Injira maze tukoherereze indi nshya.',
    fr: 'Ce lien est invalide ou a déjà été utilisé. Connectez-vous pour en recevoir un nouveau.',
  },
  'auth.goToSignIn': { en: 'Go to sign in', rw: 'Jya ahabanza', fr: 'Aller à la connexion' },
  'auth.oneQuickStep': { en: 'One quick step', rw: 'Intambwe imwe yihuse', fr: 'Une étape rapide' },
  'auth.choosePassword': {
    en: 'Choose a password',
    rw: 'Hitamo ijambobanga',
    fr: 'Choisir un mot de passe',
  },
  'auth.choosePasswordSubtitle': {
    en: "Your account was created with a temporary password. Set your own to continue — you won't need the temporary one again.",
    rw: 'Konti yawe yafunguwe n’ijambobanga ry’agateganyo. Shyiraho iryawe bwite kugira ngo ukomeze — ntabwo uzakenera irya mbere ukundi.',
    fr: 'Votre compte a été créé avec un mot de passe temporaire. Définissez le vôtre pour continuer.',
  },
  'auth.resetLinkSent': {
    en: "If an account exists for that email, we've sent a link to reset your password. Check your inbox (and spam).",
    rw: 'Niba konti ifite iyo email ihari, twohereje link yo guhindura ijambobanga. Reba muri email yawe.',
    fr: 'Si un compte existe pour cet e-mail, nous avons envoyé un lien de réinitialisation. Vérifiez votre boîte de réception.',
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
  'account.displayName': {
    en: 'Display name',
    rw: 'Izina rigaragara',
    fr: 'Nom d’affichage',
  },
  'account.avatarUrl': {
    en: 'Avatar URL',
    rw: 'Aderesi y’ifoto',
    fr: 'URL de l’avatar',
  },
  'account.avatarDesc': {
    en: 'Your photo shows on comments and your account. Paste an image URL, or leave it blank to use your initials.',
    rw: 'Ifoto yawe igaragara ku bitekerezo no kuri konti yawe. Shyiramo aderesi y’ifoto, cg uyihorere ukoreshe inyuguti z’izina ryawe.',
    fr: 'Votre photo apparaît sur les commentaires et votre compte. Collez l’URL d’une image, ou laissez vide pour utiliser vos initiales.',
  },
  'account.security': { en: 'Security', rw: 'Umutekano', fr: 'Sécurité' },
  'account.twoFactorOn': { en: 'On', rw: 'Bikora', fr: 'Activé' },
  'account.twoFactorAuth': {
    en: 'Two-factor authentication',
    rw: 'Umutekano w’intambwe ebyiri',
    fr: 'Authentification à deux facteurs',
  },
  'account.securitySubtitle': {
    en: 'Manage two-factor authentication for your account.',
    rw: 'Genjura umutekano w’intambwe ebyiri kuri konti yawe.',
    fr: 'Gérez l’authentification à deux facteurs pour votre compte.',
  },
  'account.recommendedStaff': {
    en: 'Recommended for staff',
    rw: 'Ibyasabwe ku banyamakuru',
    fr: 'Recommandé pour le personnel',
  },
  'account.twoFactorStaffNotice': {
    en: 'Two-factor authentication adds an extra layer of protection to your newsroom account. Enabling it is optional for now.',
    rw: 'Umutekano w’intambwe ebyiri wongera uburinzi kuri konti yawe y’ubwanditsi. Kuwushyiraho ni amahitamo yawe ubu.',
    fr: 'L’authentification à deux facteurs ajoute une protection supplémentaire à votre compte.',
  },
  'account.privacyAndData': {
    en: 'Privacy & data',
    rw: 'Ubuzima bwite & Imibare',
    fr: 'Confidentialité et données',
  },
  'account.privacyDesc': {
    en: 'Download everything we hold about you, or delete your account (Law N° 058/2021).',
    rw: 'Manura amakuru yose tugufiteho, cyangwa usibe konti yawe (Itegeko N° 058/2021).',
    fr: 'Téléchargez vos données ou supprimez votre compte (Loi N° 058/2021).',
  },
  'account.downloadData': {
    en: 'Download my data',
    rw: 'Manura amakuru yanjye',
    fr: 'Télécharger mes données',
  },
  'account.deleteAccount': {
    en: 'Delete my account',
    rw: 'Siba konti yanjye',
    fr: 'Supprimer mon compte',
  },
  'account.deleteAccountWarning': {
    en: "This permanently deletes your account and personal data (saved stories, follows, reading history). Published comments are kept but anonymised. This can't be undone.",
    rw: 'Ibi bizasiba burundu konti yawe n’amakuru yose (inkuru wabitse, ibyo ukurikira, ibyo wasomye). Ibitekerezo watanze bizagumaho ariko bikuweho amazina. Ibi ntibishobora gusubirwamo.',
    fr: 'Cela supprimera définitivement votre compte et vos données. Les commentaires publiés seront conservés mais anonymisés.',
  },
  'account.deleting': { en: 'Deleting…', rw: 'Gusiba…', fr: 'Suppression…' },
  'account.permanentlyDelete': {
    en: 'Permanently delete',
    rw: 'Siba burundu',
    fr: 'Supprimer définitivement',
  },
  'account.twoFactorSetUp': { en: 'Set up', rw: 'Gushyiraho', fr: 'Configurer' },
  'account.twoFactorActiveNotice': {
    en: 'Your account is protected by an authenticator app. To turn it off, enter a current code.',
    rw: 'Konti yawe irinzwe n’intambwe ebyiri. Niba ushaka kubikuraho, shyiramo kode y’ubu.',
    fr: 'Votre compte est protégé par une application d’authentification. Pour le désactiver, entrez un code actuel.',
  },
  'account.twoFactorSubtitle': {
    en: 'Add a second step at sign-in using an authenticator app (Google Authenticator, Authy, 1Password…).',
    rw: 'Ongeraho intambwe ya kabiri mu kwinjira ukoresheje porogaramu y’umutekano (Google Authenticator, Authy, 1Password…).',
    fr: 'Ajoutez une deuxième étape lors de la connexion à l’aide d’une application d’authentification.',
  },
  'account.turnOff': { en: 'Turn off', rw: 'Gukuraho', fr: 'Désactiver' },
  'account.scanQR': {
    en: '1. Scan this QR code with your authenticator app:',
    rw: '1. Sura iyi kode ya QR na porogaramu yawe y’umutekano:',
    fr: '1. Scannez ce code QR avec votre application d’authentification :',
  },
  'account.enter6Digit': {
    en: '2. Enter the 6-digit code it shows:',
    rw: '2. Shyiramo kode y’imibare 6 yerekana:',
    fr: '2. Entrez le code à 6 chiffres qu’elle affiche :',
  },
  'account.enterManualKey': {
    en: 'Or enter this key manually:',
    rw: 'Cyangwa ushyiremo iyi kii manually:',
    fr: 'Ou entrez cette clé manuellement :',
  },
  'account.verifying': { en: 'Verifying…', rw: 'Kugenzura…', fr: 'Vérification…' },
  'account.enable': { en: 'Enable', rw: 'Gukora', fr: 'Activer' },
  'account.emptySaved': {
    en: 'Nothing saved yet. Tap Save on any story to keep it here.',
    rw: 'Nta nkuru urabika. Kanda Bika ku nkuru yose ushaka kubika hano.',
    fr: 'Rien d’enregistré. Appuyez sur Enregistrer pour garder un article ici.',
  },
  'account.emptyHistory': {
    en: 'Stories you read while signed in show up here.',
    rw: 'Inkuru wasomye igihe winjiye zizagaragara hano.',
    fr: 'Les articles que vous lisez s’afficheront ici.',
  },
  'account.readAt': { en: 'Read {date}', rw: 'Wasomwe {date}', fr: 'Lu le {date}' },

  // — Roles —
  'role.admin': { en: 'Admin', rw: 'Umuyobozi', fr: 'Administrateur' },
  'role.editor': { en: 'Editor', rw: 'Umwanditsi mukuru', fr: 'Éditeur' },
  'role.journalist': { en: 'Journalist', rw: 'Umunyamakuru', fr: 'Journaliste' },
  'role.reader': { en: 'Reader', rw: 'Umusomyi', fr: 'Lecteur' },

  // — Newsletter —
  'nl.newsletter': { en: 'Newsletter', rw: 'Inyandiko y’amakuru', fr: 'Newsletter' },
  'nl.missingToken': {
    en: 'This unsubscribe link is missing its token. Please use the link from a newsletter email.',
    rw: 'Iri kura rya email ririmo kubura token. Nyamuneka koresha link iri muri email y’amakuru yohererejwe.',
    fr: 'Ce lien de désabonnement ne contient pas de jeton.',
  },
  'nl.unsubscribed': { en: "You're unsubscribed.", rw: 'Wakuweho.', fr: 'Vous êtes désabonné.' },
  'nl.unsubscribedBody': {
    en: "You won't receive The Daily Frame anymore. Changed your mind? You can resubscribe from any page.",
    rw: 'Ntabwo uzakomeza kubona The Daily Frame. Uhinduye igitekerezo? Ushobora kwiyandikisha nanone ku rupapuro rwose.',
    fr: 'Vous ne recevrez plus The Daily Frame. Vous pouvez vous réabonner à tout moment.',
  },
  'nl.unsubscribeConfirm': {
    en: 'Unsubscribe from The Daily Frame newsletter?',
    rw: 'Hagarika koherezwa The Daily Frame?',
    fr: 'Se désabonner de la newsletter The Daily Frame ?',
  },
  'nl.unsubscribeError': {
    en: 'That link looks invalid or already used.',
    rw: 'Iyo link ntikora cyangwa yashaje.',
    fr: 'Ce lien semble invalide ou a déjà été utilisé.',
  },
  'nl.unsubscribing': { en: 'Unsubscribing…', rw: 'Gukuraho…', fr: 'Désabonnement…' },
  'nl.confirmUnsubscribe': {
    en: 'Confirm unsubscribe',
    rw: 'Emeza gukurwaho',
    fr: 'Confirmer le désabonnement',
  },

  // — Inquiry (Contact/Advertise) —
  'inquiry.advertiseTitle': {
    en: 'Grow with the continent',
    rw: 'Kura hamwe n’umugabane',
    fr: 'Grandir avec le continent',
  },
  'inquiry.advertiseSubtitle': {
    en: 'Put your brand in front of Frame Africa’s readers. Tell us a little about your campaign and our team will come back to you with placements and rates.',
    rw: 'Shyira ikirango cyawe imbere y’abasomyi ba Frame Africa. Turyandikire gato ku bikorwa byawe maze itsinda ryacu rikoherereze ahaboneka n’ibiciro.',
    fr: 'Présentez votre marque aux lecteurs de Frame Africa. Parlez-nous de votre campagne.',
  },
  'inquiry.contactTitle': { en: 'Get in touch', rw: 'Twandikire', fr: 'Entrer en contact' },
  'inquiry.contactSubtitle': {
    en: 'Questions, feedback, corrections, or partnership ideas — send us a note and the right person will get back to you. For confidential story tips, use secure tips instead.',
    rw: 'Ibibazo, ibitekerezo, ibikosorwa, cyangwa ubufatanye — twandikire maze uwo bireba agusubize. Niba ufite amakuru y’ibanga cyangwa inkuru, koresha uburyo bw’amakuru y’ibanga.',
    fr: 'Questions, commentaires, corrections ou partenariats — contactez-nous.',
  },
  'inquiry.successTitle': {
    en: 'Thanks — we’ve got it.',
    rw: 'Murakoze — twabyakiriye.',
    fr: 'Merci — nous l’avons reçu.',
  },
  'inquiry.successAdvertise': {
    en: 'Our team will review your advertising enquiry and get back to you by email.',
    rw: 'Itsinda ryacu rirasuzuma ibyo kwamamaza byanyu maze rize kubasubiza kuri email.',
    fr: 'Notre équipe étudiera votre demande et vous répondra par e-mail.',
  },
  'inquiry.successContact': {
    en: 'Our team will review your message and get back to you by email.',
    rw: 'Itsinda ryacu rirasuzuma ubutumwa bwanyu maze rize kubasubiza kuri email.',
    fr: 'Notre équipe étudiera votre message et vous répondra par e-mail.',
  },
  'inquiry.name': { en: 'Your name', rw: 'Izina ryawe', fr: 'Votre nom' },
  'inquiry.company': { en: 'Company', rw: 'Ikigo / Isosiyete', fr: 'Entreprise' },
  'inquiry.placement': {
    en: 'Placement of interest',
    rw: 'Aho mwifuza ko bishyirwa',
    fr: 'Emplacement d’intérêt',
  },
  'inquiry.notSure': { en: 'Not sure yet', rw: 'Ntabwo ndabyemeza', fr: 'Pas encore sûr' },
  'inquiry.budget': {
    en: 'Estimated budget (optional)',
    rw: 'Ingengo y’imari (si ngombwa)',
    fr: 'Budget estimé (facultatif)',
  },
  'inquiry.subject': { en: 'Subject', rw: 'Umutwe w’ubutumwa', fr: 'Objet' },
  'inquiry.message': { en: 'Message', rw: 'Ubutumwa', fr: 'Message' },
  'inquiry.sendEnquiry': { en: 'Send enquiry', rw: 'Ohereza ibibazo', fr: 'Envoyer la demande' },
  'inquiry.sendMessage': { en: 'Send message', rw: 'Ohereza ubutumwa', fr: 'Envoyer le message' },
  'inquiry.reasonTitle1': {
    en: 'Engaged readers',
    rw: 'Abasomyi bakubaha',
    fr: 'Lecteurs engagés',
  },
  'inquiry.reasonBody1': {
    en: 'A growing, quality audience across Rwanda and the continent.',
    rw: 'Abantu benshi kandi bashyize mu gaciro muri u Rwanda no ku mugabane.',
    fr: 'Une audience croissante au Rwanda et sur le continent.',
  },
  'inquiry.reasonTitle2': {
    en: 'Standard IAB slots',
    rw: 'Uburyo busanzwe bw’ibirango',
    fr: 'Emplacements standards IAB',
  },
  'inquiry.reasonBody2': {
    en: 'Leaderboard, billboard, rectangle, half-page, native and newsletter.',
    rw: 'Leaderboard, billboard, rectangle, half-page, n’inyandiko y’amakuru.',
    fr: 'Leaderboard, billboard, rectangle, demi-page, natif et newsletter.',
  },
  'inquiry.reasonTitle3': {
    en: 'Brand-safe',
    rw: 'Umutekano w’ikirango',
    fr: 'Security de marque',
  },
  'inquiry.reasonBody3': {
    en: 'Independent journalism your brand can sit beside with confidence.',
    rw: 'Itangazamakuru ryigenga ikirango cyanyu gishobora kujya hafi yaryo.',
    fr: 'Un journalisme indépendant aux côtés duquel votre marque peut s’afficher.',
  },
  'inquiry.secureTipsLink': {
    en: 'secure tips',
    rw: 'makuru y’ibanga',
    fr: 'informations sécurisées',
  },

  // — Secure Tips —
  'tips.title': {
    en: 'Send a secure tip',
    rw: 'Ohereza amakuru y’ibanga',
    fr: 'Proposer une info sécurisée',
  },
  'tips.subtitle': {
    en: 'Share a confidential news tip with the Frame Africa newsroom.',
    rw: 'Sangiza amakuru y’ibanga n’ubwanditsi bwa Frame Africa.',
    fr: 'Partagez une information confidentielle avec la rédaction.',
  },
  'tips.trustSafety': {
    en: 'Trust & safety',
    rw: 'Ubwizerane & Umutekano',
    fr: 'Confiance et sécurité',
  },
  'tips.body': {
    en: "Know something the public should? Tell our newsroom. You don't have to give your name — leave a contact only if you want an editor to follow up.",
    rw: 'Hari amakuru uzi rubanda ikwiye kumenya? Bwira ubwanditsi bwacu. Ntabwo uhatirwa kuvuga izina ryawe — andika aho wagoterezwa gusa niba wifuza ko umwanditsi mukuru agukurikirana.',
    fr: 'Vous savez quelque chose qui mérite d’être public ? Dites-le à la rédaction. Vous n’avez pas à donner votre nom.',
  },
  'tips.bullet1': {
    en: "We never publish a tipster's identity without explicit consent.",
    rw: 'Ntabwo twigera dutangaza uwo ari we wese uduha amakuru tutabyemeranyijweho.',
    fr: 'Nous ne publions jamais l’identité d’un informateur sans son consentement.',
  },
  'tips.bullet2': {
    en: 'Tips are stored without your account and read only by senior editors.',
    rw: 'Amakuru abikwa adafitanye isano na konti yawe kandi asomwa gusa n’abanditsi bakuru.',
    fr: 'Les infos sont stockées anonymement et lues uniquement par les éditeurs seniors.',
  },
  'tips.bullet3': {
    en: 'For maximum anonymity, avoid work devices/networks and consider a VPN or the Tor Browser — no web form can hide your network metadata by itself.',
    rw: 'Kugira ngo ubumene bwawe bugume mu banga, irinde gukoresha ibikoresho by’akazi cyangwa internet y’akazi maze ukoreshe VPN cyangwa Tor Browser.',
    fr: 'Pour un anonymat maximal, évitez les appareils professionnels et utilisez un VPN ou Tor.',
  },
  'tips.success': { en: 'Thank you.', rw: 'Murakoze cyane.', fr: 'Merci.' },
  'tips.successBody': {
    en: 'Your tip has reached our newsroom. If you left a contact and it checks out, an editor may follow up.',
    rw: 'Amakuru yanyu yageze mu bwanditsi bwacu. Niba wasize aho wagoterezwa kandi bikaba bikora, umwanditsi mukuru aragushaka.',
    fr: 'Votre message a bien été transmis. Si vous avez laissé vos coordonnées, un éditeur pourra vous recontacter.',
  },
  'tips.sendAnother': {
    en: 'Send another',
    rw: 'Ohereza andi makuru',
    fr: 'Envoyer une autre info',
  },
  'tips.label': { en: 'Your tip', rw: 'Amakuru yanyu', fr: 'Votre info' },
  'tips.placeholder': {
    en: 'What should we look into? Include what you know, and where it happened.',
    rw: 'Niki dushaka ko dukurikirana? Andika ibyo uzi, n’aho byabereye.',
    fr: 'Sur quoi devons-nous enquêter ? Indiquez ce que vous savez et où cela s’est passé.',
  },
  'tips.contact': {
    en: 'Contact (optional)',
    rw: 'Aho wagoterezwa (si ngombwa)',
    fr: 'Contact (facultatif)',
  },
  'tips.contactPlaceholder': {
    en: 'An email or phone, only if you want us to reach you',
    rw: 'Email cyangwa telefone, niba gusa wifuza ko tukubaza',
    fr: 'Un e-mail ou un téléphone, uniquement si vous souhaitez être recontacté',
  },
  'tips.sendSecurely': {
    en: 'Send securely',
    rw: 'Ohereza mu banga',
    fr: 'Envoyer de manière sécurisée',
  },

  // — Dashboard chrome —
  'dash.welcome': { en: 'Welcome back', rw: 'Murakaza neza', fr: 'Bon retour' },
  'dash.newStory': { en: 'New story', rw: 'Inkuru nshya', fr: 'Nouvel article' },
  'dash.searchArticles': {
    en: 'Search articles…',
    rw: 'Shakisha inkuru…',
    fr: 'Rechercher des articles…',
  },
  'dash.notifications': { en: 'Notifications', rw: 'Amamenyesha', fr: 'Notifications' },
  'dash.markAllRead': {
    en: 'Mark all read',
    rw: 'Merka byose ko byasomwe',
    fr: 'Tout marquer comme lu',
  },
  'dash.caughtUp': {
    en: 'You’re all caught up.',
    rw: 'Nta gishya gisigaye.',
    fr: 'Vous êtes à jour.',
  },
  // Dashboard nav section headings
  'dash.sec.newsroom': { en: 'Newsroom', rw: 'Ubwanditsi', fr: 'Rédaction' },
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

  // Weather descriptions
  'weather.clear': { en: 'Clear', rw: 'Umucyo', fr: 'Dégagé' },
  'weather.partlyCloudy': {
    en: 'Partly cloudy',
    rw: 'Ibijyana n’ibicu',
    fr: 'Partiellement nuageux',
  },
  'weather.overcast': { en: 'Overcast', rw: 'Igicuku', fr: 'Couvert' },
  'weather.fog': { en: 'Fog', rw: 'Igihu', fr: 'Brouillard' },
  'weather.drizzle': { en: 'Drizzle', rw: 'Akanyarirajisho', fr: 'Bruine' },
  'weather.rain': { en: 'Rain', rw: 'Imvura', fr: 'Pluie' },
  'weather.snow': { en: 'Snow', rw: 'Barafura', fr: 'Neige' },
  'weather.thunderstorm': { en: 'Thunderstorm', rw: 'Imvura y’inkuba', fr: 'Orage' },
  'weather.cloudy': { en: 'Cloudy', rw: 'Ibicubicu', fr: 'Nuageux' },
  'dash.expandSidebar': {
    en: 'Expand sidebar',
    rw: 'Kwagura menu',
    fr: 'Agrandir la barre latérale',
  },
  'dash.collapseSidebar': {
    en: 'Collapse sidebar',
    rw: 'Gukonya menu',
    fr: 'Réduire la barre latérale',
  },

  // Categories & Sections
  'category.news': { en: 'News', rw: 'Amakuru', fr: 'Actualités' },
  'category.business': { en: 'Business', rw: 'Ubucuruzi', fr: 'Affaires' },
  'category.technology': { en: 'Technology', rw: 'Ikoranabuhanga', fr: 'Technologie' },
  'category.sports': { en: 'Sport', rw: 'Imikino', fr: 'Sports' },
  'category.opinion': { en: 'Opinion', rw: 'Ibitekerezo', fr: 'Opinion' },
  'category.culture': { en: 'Culture & Life', rw: 'Umuco n’Imibereho', fr: 'Culture & Vie' },
  'category.health': { en: 'Health', rw: 'Ubuzima', fr: 'Santé' },
  'category.environment': {
    en: 'Environment & Climate',
    rw: 'Ibidukikije n’Ikirere',
    fr: 'Environnement & Climat',
  },
  'category.multimedia': { en: 'Multimedia', rw: 'Amashusho n’Amajwi', fr: 'Multimédia' },
  'category.notices': { en: 'Notices', rw: 'Amatangazo', fr: 'Annonces' },
  'category.education': { en: 'Education', rw: 'Uburezi', fr: 'Éducation' },
  'category.agriculture': { en: 'Agriculture', rw: 'Ubuhinzi', fr: 'Agriculture' },
  'category.science': { en: 'Science', rw: 'Siyansi', fr: 'Science' },
  'category.investigations': { en: 'Investigations', rw: 'Iperereza', fr: 'Enquêtes' },
  'category.fact-check': { en: 'Fact Check', rw: 'Kugenzura Ukuri', fr: 'Fact Checking' },
  'category.live': { en: 'Live', rw: 'Imbonankubone', fr: 'Direct' },

  // Sub-sections
  'category.rwanda': { en: 'Rwanda', rw: 'Rwanda', fr: 'Rwanda' },
  'category.kigali': { en: 'Kigali', rw: 'Kigali', fr: 'Kigali' },
  'category.east-africa': {
    en: 'East Africa',
    rw: 'Afurika y’Iburasirazuba',
    fr: 'Afrique de l’Est',
  },
  'category.africa': { en: 'Africa', rw: 'Afurika', fr: 'Afrique' },
  'category.world': { en: 'World', rw: 'Isi', fr: 'Monde' },
  'category.politics': { en: 'Politics', rw: 'Politiki', fr: 'Politique' },
  'category.diplomacy': { en: 'Diplomacy', rw: 'Diplomasi', fr: 'Diplomatie' },
  'category.crime-justice': {
    en: 'Crime & Justice',
    rw: 'Ubujura n’Ubutabera',
    fr: 'Criminalité & Justice',
  },
  'category.economy': { en: 'Economy', rw: 'Ubukungu', fr: 'Économie' },
  'category.markets': { en: 'Markets', rw: 'Amasoko', fr: 'Marchés' },
  'category.companies': { en: 'Companies', rw: 'Ibigo', fr: 'Entreprises' },
  'category.banking-finance': {
    en: 'Banking & Finance',
    rw: 'Amabanki n’Imari',
    fr: 'Banque & Finance',
  },
  'category.agribusiness': { en: 'Agribusiness', rw: 'Ubucuruzi bw’Ubuhinzi', fr: 'Agro-business' },
  'category.startups': { en: 'Startups & Tech', rw: 'Imishinga Mishya', fr: 'Startups' },
  'category.real-estate': { en: 'Real Estate', rw: 'Imitungo Itimukanwa', fr: 'Immobilier' },
  'category.personal-finance': {
    en: 'Personal Finance',
    rw: 'Imari y’Umuntu ku Giti Cye',
    fr: 'Finances Personnelles',
  },
  'category.mobile': { en: 'Mobile', rw: 'Terefone', fr: 'Mobile' },
  'category.internet': { en: 'Internet', rw: 'Interineti', fr: 'Internet' },
  'category.ai': { en: 'AI', rw: 'Ibwenge Buhangano', fr: 'IA' },
  'category.fintech': { en: 'Fintech', rw: 'Fintech', fr: 'Fintech' },
  'category.gadgets': { en: 'Gadgets', rw: 'Ibikoresho by’Ikoranabuhanga', fr: 'Gadgets' },
  'category.football': { en: 'Football', rw: 'Umupira w’Amaguru', fr: 'Football' },
  'category.athletics': { en: 'Athletics', rw: 'Imikino Ngororamubiri', fr: 'Athlétisme' },
  'category.basketball': { en: 'Basketball', rw: 'Basketball', fr: 'Basketball' },
  'category.cycling': { en: 'Cycling', rw: 'Gusiganwa ku Magare', fr: 'Cyclisme' },
  'category.volleyball': { en: 'Volleyball', rw: 'Volleyball', fr: 'Volleyball' },
  'category.motorsport': {
    en: 'Motorsport',
    rw: 'Imikino yo Gusiganwa n’Imodoka',
    fr: 'Sports Mécaniques',
  },
  'category.editorials': { en: 'Editorials', rw: 'Inyandiko y’Ubwanditsi', fr: 'Éditoriaux' },
  'category.op-eds': { en: 'Op-Eds', rw: 'Ibitekerezo by’Abasomyi', fr: 'Tribunes' },
  'category.columns': { en: 'Columns', rw: 'Inyandiko zihariye', fr: 'Chroniques' },
  'category.letters': { en: 'Letters', rw: 'Inyandiko z’Abasomyi', fr: 'Courrier' },
  'category.cartoons': { en: 'Cartoons', rw: 'Ibishushanyo Bisekeje', fr: 'Caricatures' },
  'category.arts': { en: 'Arts', rw: 'Ubugeni', fr: 'Arts' },
  'category.music': { en: 'Music', rw: 'Muzika', fr: 'Musique' },
  'category.film-tv': { en: 'Film & TV', rw: 'Filimi na Televiziyo', fr: 'Cinéma & TV' },
  'category.books': { en: 'Books', rw: 'Ibitabo', fr: 'Livres' },
  'category.food-drink': {
    en: 'Food & Drink',
    rw: 'Ibiribwa n’Ibinyobwa',
    fr: 'Cuisine & Boisson',
  },
  'category.fashion': { en: 'Fashion', rw: 'Imideri', fr: 'Mode' },
  'category.travel': { en: 'Travel & Tourism', rw: 'Ubukerarugendo', fr: 'Voyages & Tourisme' },
  'category.lifestyle': { en: 'Lifestyle', rw: 'Imibereho', fr: 'Style de vie' },
  'category.religion': { en: 'Religion', rw: 'Idini', fr: 'Religion' },
  'category.public-health': { en: 'Public Health', rw: 'Ubuzima Rusange', fr: 'Santé Publique' },
  'category.wellness': { en: 'Wellness', rw: 'Ubuzima Bwiza', fr: 'Bien-être' },
  'category.medicine': { en: 'Medicine', rw: 'Ubuvuzi', fr: 'Médecine' },
  'category.climate': { en: 'Climate', rw: 'Ikirere', fr: 'Climat' },
  'category.conservation': {
    en: 'Conservation',
    rw: 'Kubungabunga Ibidukikije',
    fr: 'Conservation',
  },
  'category.energy': { en: 'Energy', rw: 'Ingufu', fr: 'Énergie' },
  'category.schools': { en: 'Schools', rw: 'Amashuri', fr: 'Écoles' },
  'category.higher-education': {
    en: 'Higher Education',
    rw: 'Kaminuza n’Amashuri Makuru',
    fr: 'Enseignement Supérieur',
  },
  'category.skills': { en: 'Skills', rw: 'Ubwenge n’Ubumenyingiro', fr: 'Compétences' },
  'category.crops': { en: 'Crops', rw: 'Ibihingwa', fr: 'Cultures' },
  'category.livestock': { en: 'Livestock', rw: 'Ubworozi', fr: 'Élevage' },
  'category.agri-tech': { en: 'Agri-tech', rw: 'Ikoranabuhanga mu Buhinzi', fr: 'Agri-tech' },
  'category.video': { en: 'Video', rw: 'Amashusho', fr: 'Vidéo' },
  'category.tenders': { en: 'Tenders', rw: 'Ipiganwa ry’Amasoko', fr: 'Appels d’offres' },
  'category.obituaries': { en: 'Obituaries', rw: 'Amatangazo yo Gupfa', fr: 'Nécrologie' },
  'category.public-notices': { en: 'Public Notices', rw: 'Amatangazo Rusange', fr: 'Avis Publics' },
  'category.announcements': { en: 'Announcements', rw: 'Amatangazo', fr: 'Annonces' },
  'category.jobs': { en: 'Jobs', rw: 'Akazi', fr: 'Emplois' },
  'common.section': { en: 'Section', rw: 'Igice', fr: 'Section' },
  'common.min': { en: 'min', rw: 'iminota', fr: 'min' },
  'common.topic': { en: 'Topic', rw: 'Insanganyamatsiko', fr: 'Sujet' },
  'topic.empty': {
    en: 'No stories tagged with this topic yet.',
    rw: 'Nta nkuru zifite iyi nsanganyamatsiko kugeza ubu.',
    fr: 'Aucun article lié à ce sujet pour le moment.',
  },
  'section.empty': {
    en: 'No stories in this section yet.',
    rw: 'Nta nkuru ziri muri iki gice kugeza ubu.',
    fr: 'Aucun article dans cette section pour le moment.',
  },
  'search.placeholder': {
    en: 'Search published stories…',
    rw: 'Shakisha inkuru zatangajwe…',
    fr: 'Rechercher des articles publiés…',
  },
  'search.ariaLabel': {
    en: 'Search articles',
    rw: 'Shakisha inkuru',
    fr: 'Rechercher des articles',
  },
  'search.emptyPrompt': {
    en: 'Type a term above to search published stories.',
    rw: 'Andika ijambo hejuru ngo ushakishe inkuru.',
    fr: 'Saisissez un terme ci-dessus pour rechercher des articles.',
  },
  'search.error': {
    en: 'Search is unavailable right now. Please try again shortly.',
    rw: 'Gushakisha ntibikora ubu. Ongera ugerageze mukanya.',
    fr: 'La recherche est indisponible pour le moment. Veuillez réessayer plus tard.',
  },
  'search.metaTitle': {
    en: 'Search — Frame Africa',
    rw: 'Shakisha — Frame Africa',
    fr: 'Recherche — Frame Africa',
  },
  'article.topics': { en: 'Topics', rw: 'Insanganyamatsiko', fr: 'Sujets' },
  'article.premiumStory': { en: 'Premium story', rw: 'Inkuru y’umwihariko', fr: 'Article premium' },
  'article.subscribeKeepReading': {
    en: 'Subscribe to keep reading',
    rw: 'Iyandikishe kugira ngo ukomeze usome',
    fr: 'Abonnez-vous pour continuer à lire',
  },
  'article.lockedBody': {
    en: 'This story is available to Frame Africa subscribers. Plans and payment (MoMo, Airtel Money, card) are coming soon.',
    rw: 'Iyi nkuru igenewe abanyamuryango ba Frame Africa biyandikishije. Uburyo bwo kwishyura (MoMo, Airtel Money, ikarita) buraza vuba.',
    fr: 'Cet article est réservé aux abonnés de Frame Africa. Les formules et modes de paiement (MoMo, Airtel Money, carte) seront bientôt disponibles.',
  },
  'article.photoCredit': { en: 'Photo', rw: 'Ifoto', fr: 'Photo' },
  'foryou.metaDesc': {
    en: 'Your personalised feed, built from the sections and topics you follow.',
    rw: 'Amakuru wihitiye, ashingiye ku bice n’insanganyamatsiko ukurikira.',
    fr: 'Votre flux personnalisé, construit à partir des sections et des sujets que vous suivez.',
  },
  'foryou.feedTitle': { en: '{name}’s feed', rw: 'Amakuru ya {name}', fr: 'Flux de {name}' },
  'foryou.personalizedDesc': {
    en: 'Stories from the sections and topics you follow, and what you read most.',
    rw: 'Inkuru z’ibice n’insanganyamatsiko ukurikira, hamwe n’ibyo usoma cyane.',
    fr: 'Articles des sections et sujets que vous suivez, et ce que vous lisez le plus.',
  },
  'foryou.fallbackDesc': {
    en: 'The latest news for now — follow sections and topics to personalise this feed.',
    rw: 'Amakuru agezweho ubu — kurikira ibice n’insanganyamatsiko kugira ngo uhitemo ayo wifuza.',
    fr: 'Les dernières actualités pour le moment — suivez des sections et sujets pour personnaliser ce flux.',
  },
  'foryou.empty': {
    en: 'Nothing here yet. Follow a few sections or topics to fill your feed.',
    rw: 'Nta kintu kiri hano kugeza ubu. Kurikira ibice bimwe cyangwa insanganyamatsiko kugira ngo wuzuze uru rupapuro.',
    fr: 'Rien ici pour le moment. Suivez quelques sections ou sujets pour remplir votre flux.',
  },
  'foryou.followPrompt.tap': { en: 'Tap ', rw: 'Kanda ', fr: 'Appuyez sur ' },
  'foryou.followPrompt.follow': { en: 'Follow', rw: 'Gukurikira', fr: 'Suivre' },
  'foryou.followPrompt.onAny': { en: ' on any ', rw: ' ku gice ', fr: ' sur n’importe quelle ' },
  'foryou.followPrompt.section': { en: 'section', rw: 'icyo aricyo cyose', fr: 'section' },
  'foryou.followPrompt.orTopic': {
    en: ' or topic and it’ll shape this feed. Manage who you follow from your ',
    rw: ' cyangwa insanganyamatsiko kugira ngo ugenzure amakuru ubona. Genzura abo ukurikira muri ',
    fr: ' ou sujet pour personnaliser ce flux. Gérez vos abonnements depuis votre ',
  },
  'foryou.followPrompt.account': { en: 'account', rw: 'konti yawe', fr: 'compte' },
  'common.saved': { en: 'Saved', rw: 'Byabitswe', fr: 'Enregistré' },
  'share.byEmail': { en: 'Share by email', rw: 'Sangiza kuri email', fr: 'Partager par e-mail' },
  'share.copyLink': { en: 'Copy link', rw: 'Kopera link', fr: 'Copier le lien' },
  'share.label': { en: 'Share', rw: 'Sangiza', fr: 'Partager' },
  'article.signInToLike': {
    en: 'Sign in to like',
    rw: 'Injira ngo ukunde',
    fr: 'Connectez-vous pour aimer',
  },
  'article.likes': { en: 'likes', rw: 'bayikunze', fr: 'j’aimes' },
  'article.like': { en: 'like', rw: 'wayikunze', fr: 'j’aime' },

  // ===== Dashboard content (staff CMS) =====
  'd.common.new': { en: 'New', rw: 'Gishya', fr: 'Nouveau' },
  'd.common.save': { en: 'Save', rw: 'Bika', fr: 'Enregistrer' },
  'd.common.saving': { en: 'Saving…', rw: 'Kubika…', fr: 'Enregistrement…' },
  'd.common.saved': { en: 'Saved.', rw: 'Byabitswe.', fr: 'Enregistré.' },
  'd.common.delete': { en: 'Delete', rw: 'Siba', fr: 'Supprimer' },
  'd.common.deleted': { en: 'Deleted.', rw: 'Byasibwe.', fr: 'Supprimé.' },
  'd.common.edit': { en: 'Edit', rw: 'Hindura', fr: 'Modifier' },
  'd.common.publish': { en: 'Publish', rw: 'Tangaza', fr: 'Publier' },
  'd.common.unpublish': { en: 'Unpublish', rw: 'Kuraho', fr: 'Dépublier' },
  'd.common.published': { en: 'Published', rw: 'Byatangajwe', fr: 'Publié' },
  'd.common.draft': { en: 'Draft', rw: 'Umushinga', fr: 'Brouillon' },
  'd.common.updated': { en: 'Updated.', rw: 'Byavuguruwe.', fr: 'Mis à jour.' },
  'd.common.adding': { en: 'Adding…', rw: 'Kongeraho…', fr: 'Ajout…' },
  'd.common.add': { en: 'Add', rw: 'Ongeraho', fr: 'Ajouter' },
  'd.common.upload': { en: 'Upload', rw: 'Ohereza', fr: 'Téléverser' },
  'd.common.uploading': { en: 'Uploading…', rw: 'Kohereza…', fr: 'Téléversement…' },
  'd.common.danger': { en: 'Danger', rw: 'Akaga', fr: 'Zone sensible' },
  'd.common.cover': { en: 'Cover', rw: 'Igifuniko', fr: 'Couverture' },
  'd.common.title': { en: 'Title', rw: 'Umutwe', fr: 'Titre' },
  'd.common.description': { en: 'Description', rw: 'Ibisobanuro', fr: 'Description' },
  'd.common.sessionExpired': {
    en: 'Session expired — sign in again.',
    rw: 'Igihe cyararangiye — ongera winjire.',
    fr: 'Session expirée — reconnectez-vous.',
  },
  'd.common.total': { en: 'total', rw: 'byose', fr: 'au total' },

  // — Videos dashboard —
  'dvid.subtitle': {
    en: 'The YouTube hub — sync the channel or curate clips by hand.',
    rw: 'Ahabikwa amashusho ya YouTube — huza umuyoboro cyangwa wongeremo amashusho ku giti cyawe.',
    fr: 'Le hub YouTube — synchronisez la chaîne ou ajoutez des clips manuellement.',
  },
  'dvid.inLibrary': { en: 'in the library', rw: 'mu bubiko', fr: 'dans la bibliothèque' },
  'dvid.sync': {
    en: 'Sync from YouTube',
    rw: 'Huza uva kuri YouTube',
    fr: 'Synchroniser depuis YouTube',
  },
  'dvid.youtubeUrl': { en: 'YouTube URL', rw: 'Umuyoboro wa YouTube', fr: 'URL YouTube' },
  'dvid.titleOptional': {
    en: '(optional if API key set)',
    rw: '(bitegetswe iyo API ihari)',
    fr: '(facultatif si la clé API est configurée)',
  },
  'dvid.clipTitle': { en: 'Clip title', rw: 'Umutwe w’ishusho', fr: 'Titre du clip' },
  'dvid.addClip': { en: 'Add clip', rw: 'Ongeraho ishusho', fr: 'Ajouter un clip' },
  'dvid.notConfigured': {
    en: 'YouTube isn’t configured yet — add the API key + channel id in Settings.',
    rw: 'YouTube ntiratunganywa — ongeraho API na ID y’umuyoboro mu Igenamiterere.',
    fr: 'YouTube n’est pas encore configuré — ajoutez la clé API et l’ID de chaîne dans les Paramètres.',
  },
  'dvid.empty': {
    en: 'No videos yet.',
    rw: 'Nta mashusho arahaba.',
    fr: 'Aucune vidéo pour le moment.',
  },
  'dvid.emptyHint': {
    en: 'Sync a channel or add a clip by URL',
    rw: 'Huza umuyoboro cyangwa wongeremo ishusho na URL',
    fr: 'Synchronisez une chaîne ou ajoutez un clip par URL',
  },
  'dvid.feature': { en: 'Feature', rw: 'Shyira imbere', fr: 'Mettre en avant' },
  'dvid.featured': { en: 'Featured', rw: 'Iri imbere', fr: 'En avant' },
  'dvid.hide': { en: 'Hide', rw: 'Hisha', fr: 'Masquer' },
  'dvid.show': { en: 'Show', rw: 'Erekana', fr: 'Afficher' },
  'dvid.hidden': { en: 'Hidden', rw: 'Byahishwe', fr: 'Masqué' },
  'dvid.deleteAria': { en: 'Delete video', rw: 'Siba ishusho', fr: 'Supprimer la vidéo' },

  // — Galleries dashboard —
  'dgal.subtitle': {
    en: 'Visual stories built from the media library.',
    rw: 'Inkuru z’amashusho zubatswe ku bubiko bw’amashusho.',
    fr: 'Des histoires visuelles créées depuis la médiathèque.',
  },
  'dgal.newGallery': { en: 'New gallery', rw: 'Ishusho nshya', fr: 'Nouvelle galerie' },
  'dgal.empty': {
    en: 'No galleries yet.',
    rw: 'Nta mashusho arahaba.',
    fr: 'Aucune galerie pour le moment.',
  },
  'dgal.emptyHint': {
    en: 'Create one to get started',
    rw: 'Kora imwe kugira ngo utangire',
    fr: 'Créez-en une pour commencer',
  },
  'dgal.photos': { en: 'photos', rw: 'amafoto', fr: 'photos' },

  // — Podcasts dashboard —
  'dpod.subtitle': {
    en: 'Shows and episodes — audio or video.',
    rw: 'Porogaramu n’ibice — ijwi cyangwa ishusho.',
    fr: 'Émissions et épisodes — audio ou vidéo.',
  },
  'dpod.newShow': { en: 'New show', rw: 'Porogaramu nshya', fr: 'Nouvelle émission' },
  'dpod.empty': {
    en: 'No shows yet.',
    rw: 'Nta porogaramu zirahaba.',
    fr: 'Aucune émission pour le moment.',
  },
  'dpod.emptyHint': {
    en: 'Create a show, then add episodes',
    rw: 'Kora porogaramu, hanyuma wongereho ibice',
    fr: 'Créez une émission, puis ajoutez des épisodes',
  },
  'dpod.episodes': { en: 'episodes', rw: 'ibice', fr: 'épisodes' },
  'dpod.show': { en: 'shows', rw: 'porogaramu', fr: 'émissions' },

  // — Interactives dashboard —
  'dint.subtitle': {
    en: 'Embedded charts and interactive graphics.',
    rw: 'Imbonerahamwe n’ibishushanyo bishyizwemo.',
    fr: 'Graphiques et infographies interactives intégrés.',
  },
  'dint.newInteractive': {
    en: 'New interactive',
    rw: 'Ikinyabikorwa gishya',
    fr: 'Nouvel interactif',
  },
  'dint.empty': { en: 'Nothing yet.', rw: 'Nta kintu kirahaba.', fr: 'Rien pour le moment.' },
  'dint.emptyHint': {
    en: 'Embed a Datawrapper, Flourish, Infogram or Google chart',
    rw: 'Shyiramo imbonerahamwe ya Datawrapper, Flourish, Infogram cyangwa Google',
    fr: 'Intégrez un graphique Datawrapper, Flourish, Infogram ou Google',
  },

  // — Shared editor strings —
  'de.moveUp': { en: 'Move up', rw: 'Zamura', fr: 'Monter' },
  'de.moveDown': { en: 'Move down', rw: 'Manura', fr: 'Descendre' },
  'de.imageUrl': {
    en: 'Image URL (/uploads/…)',
    rw: 'URL y’ifoto (/uploads/…)',
    fr: 'URL de l’image (/uploads/…)',
  },
  'de.altText': {
    en: 'Alt text (accessibility)',
    rw: 'Umwandiko usimbura (accessibility)',
    fr: 'Texte alternatif (accessibilité)',
  },
  'de.credit': { en: 'Credit', rw: 'Uwabikoze', fr: 'Crédit' },
  'de.caption': { en: 'Caption', rw: 'Umutwe muto', fr: 'Légende' },
  'de.coverUrl': {
    en: 'Cover image URL',
    rw: 'URL y’ifoto y’igifuniko',
    fr: 'URL de l’image de couverture',
  },
  'de.coverAlt': {
    en: 'Cover alt text',
    rw: 'Umwandiko usimbura igifuniko',
    fr: 'Texte alternatif de couverture',
  },
  'de.addTitleFirst': {
    en: 'Add a title first.',
    rw: 'Banza wongereho umutwe.',
    fr: 'Ajoutez d’abord un titre.',
  },
  'de.movedToDraft': {
    en: 'Moved to draft.',
    rw: 'Byashyizwe mu mushinga.',
    fr: 'Remis en brouillon.',
  },
  'de.publishedMsg': { en: 'Published.', rw: 'Byatangajwe.', fr: 'Publié.' },

  // — Gallery editor —
  'dgal.editGallery': { en: 'Edit gallery', rw: 'Hindura ishusho', fr: 'Modifier la galerie' },
  'dgal.photosHeading': { en: 'Photos', rw: 'Amafoto', fr: 'Photos' },
  'dgal.addPhoto': { en: 'Add photo', rw: 'Ongeraho ifoto', fr: 'Ajouter une photo' },
  'dgal.noPhotos': {
    en: 'No photos yet. Paste image URLs from the media library.',
    rw: 'Nta mafoto arahaba. Shyiramo URL z’amafoto uzikura mu bubiko.',
    fr: 'Aucune photo. Collez des URL d’images depuis la médiathèque.',
  },
  'dgal.removePhoto': { en: 'Remove photo', rw: 'Kuraho ifoto', fr: 'Retirer la photo' },
  'dgal.deleteGallery': { en: 'Delete gallery', rw: 'Siba ishusho', fr: 'Supprimer la galerie' },

  // — Podcast show editor —
  'dpod.showTitle': { en: 'Show title', rw: 'Umutwe wa porogaramu', fr: 'Titre de l’émission' },
  'dpod.editShow': { en: 'Edit show', rw: 'Hindura porogaramu', fr: 'Modifier l’émission' },
  'dpod.addTitleFirst': {
    en: 'Add a show title first.',
    rw: 'Banza wongereho umutwe wa porogaramu.',
    fr: 'Ajoutez d’abord un titre d’émission.',
  },
  'dpod.deleteShow': { en: 'Delete show', rw: 'Siba porogaramu', fr: 'Supprimer l’émission' },
  'dpod.episodesHeading': { en: 'Episodes', rw: 'Ibice', fr: 'Épisodes' },
  'dpod.episodeTitle': { en: 'Episode title', rw: 'Umutwe w’igice', fr: 'Titre de l’épisode' },
  'dpod.type': { en: 'Type', rw: 'Ubwoko', fr: 'Type' },
  'dpod.audio': { en: 'Audio', rw: 'Ijwi', fr: 'Audio' },
  'dpod.video': { en: 'Video', rw: 'Ishusho', fr: 'Vidéo' },
  'dpod.mediaAudio': {
    en: 'Audio — paste a URL (Spotify/host) or upload',
    rw: 'Ijwi — shyiramo URL (Spotify/host) cyangwa wohereze',
    fr: 'Audio — collez une URL (Spotify/hôte) ou téléversez',
  },
  'dpod.mediaVideo': {
    en: 'Video — paste a URL (YouTube/host) or upload',
    rw: 'Ishusho — shyiramo URL (YouTube/host) cyangwa wohereze',
    fr: 'Vidéo — collez une URL (YouTube/hôte) ou téléversez',
  },
  'dpod.notes': { en: 'Notes (optional)', rw: 'Inyandiko (bitegetswe)', fr: 'Notes (facultatif)' },
  'dpod.addEpisode': { en: 'Add episode', rw: 'Ongeraho igice', fr: 'Ajouter un épisode' },
  'dpod.episodeAdded': {
    en: 'Episode added as a draft.',
    rw: 'Igice cyongeweho nk’umushinga.',
    fr: 'Épisode ajouté en brouillon.',
  },
  'dpod.deleteEpisode': { en: 'Delete episode', rw: 'Siba igice', fr: 'Supprimer l’épisode' },
  'dpod.episodeNeeds': {
    en: 'An episode needs a title and a media URL (or uploaded file).',
    rw: 'Igice gisaba umutwe na URL y’umuziki (cyangwa dosiye yoherejwe).',
    fr: 'Un épisode nécessite un titre et une URL média (ou un fichier téléversé).',
  },
  'dpod.mediaPlaceholder': {
    en: 'Media URL, or upload a file →',
    rw: 'URL y’umuziki, cyangwa ohereza dosiye →',
    fr: 'URL média, ou téléversez un fichier →',
  },

  // — Interactive editor —
  'dint.editInteractive': {
    en: 'Edit interactive',
    rw: 'Hindura ikinyabikorwa',
    fr: 'Modifier l’interactif',
  },
  'dint.embedUrl': { en: 'Embed URL', rw: 'URL yo gushyiramo', fr: 'URL d’intégration' },
  'dint.embedHint': {
    en: 'Only Datawrapper, Flourish, Infogram, Google (Data Studio/Looker/Sheets) and YouTube are accepted.',
    rw: 'Hemewe gusa Datawrapper, Flourish, Infogram, Google (Data Studio/Looker/Sheets) na YouTube.',
    fr: 'Seuls Datawrapper, Flourish, Infogram, Google (Data Studio/Looker/Sheets) et YouTube sont acceptés.',
  },
  'dint.sourceCredit': {
    en: 'Source / credit',
    rw: 'Aho byavuye / uwabikoze',
    fr: 'Source / crédit',
  },
  'dint.aspectRatio': { en: 'Aspect ratio', rw: 'Igipimo cy’ishusho', fr: 'Format d’image' },
  'dint.preview': { en: 'Preview', rw: 'Igaragaza', fr: 'Aperçu' },
  'dint.coverHub': {
    en: 'Cover (hub thumbnail)',
    rw: 'Igifuniko (agafoto)',
    fr: 'Couverture (vignette)',
  },
  'dint.addTitleUrl': {
    en: 'Add a title and a provider embed URL.',
    rw: 'Ongeraho umutwe na URL yo gushyiramo.',
    fr: 'Ajoutez un titre et une URL d’intégration.',
  },
  'dint.embedPlaceholder': {
    en: 'https://datawrapper.dwcdn.net/…, flourish, infogram, Google, YouTube',
    rw: 'https://datawrapper.dwcdn.net/…, flourish, infogram, Google, YouTube',
    fr: 'https://datawrapper.dwcdn.net/…, flourish, infogram, Google, YouTube',
  },
  'd.common.sending': { en: 'Sending…', rw: 'Kohereza…', fr: 'Envoi…' },

  // — Newsletter dashboard —
  'dnl.subtitle': {
    en: 'Compose and send an update to your subscribers.',
    rw: 'Andika kandi wohereze ubutumwa ku biyandikishije.',
    fr: 'Composez et envoyez une actualité à vos abonnés.',
  },
  'dnl.compose': { en: 'Compose', rw: 'Andika', fr: 'Rédiger' },
  'dnl.subject': { en: 'Subject', rw: 'Ingingo', fr: 'Objet' },
  'dnl.body': { en: 'Body', rw: 'Ibirimo', fr: 'Contenu' },
  'dnl.sendToPrefix': { en: 'Send to', rw: 'Ohereza kuri', fr: 'Envoyer à' },
  'dnl.subscribers': { en: 'subscribers', rw: 'biyandikishije', fr: 'abonnés' },
  'dnl.sent': { en: 'Sent —', rw: 'Byoherejwe —', fr: 'Envoyé —' },
  'dnl.recipientsRecorded': {
    en: 'recipients recorded.',
    rw: 'abakiriye banditswe.',
    fr: 'destinataires enregistrés.',
  },
  'dnl.deliveryNote': {
    en: 'Delivery uses the configured mail worker; recipients are recorded here.',
    rw: 'Kohereza bikoresha porogaramu ya email yashyizweho; abakiriye banditswe hano.',
    fr: 'L’envoi utilise le service mail configuré ; les destinataires sont enregistrés ici.',
  },
  'dnl.activeSubscribers': {
    en: 'Active subscribers',
    rw: 'Biyandikishije bakora',
    fr: 'Abonnés actifs',
  },
  'dnl.recentCampaigns': {
    en: 'Recent campaigns',
    rw: 'Ubutumwa buheruka',
    fr: 'Campagnes récentes',
  },
  'dnl.noneSent': {
    en: 'None sent yet.',
    rw: 'Nta bwoherejwe.',
    fr: 'Aucun envoi pour le moment.',
  },
  'dnl.recipients': { en: 'recipients', rw: 'abakiriye', fr: 'destinataires' },

  // — Inquiries dashboard —
  'dinq.subtitle': {
    en: 'Advertising enquiries and contact messages from the site.',
    rw: 'Ibibazo byo kwamamaza n’ubutumwa bwo twandikire biva ku rubuga.',
    fr: 'Demandes publicitaires et messages de contact du site.',
  },
  'dinq.workThrough': {
    en: 'total — work them through New → In progress → Closed.',
    rw: 'byose — bikorwe uhereye New → In progress → Closed.',
    fr: 'au total — traitez-les de Nouveau → En cours → Clôturé.',
  },
  'dinq.all': { en: 'All', rw: 'Byose', fr: 'Tout' },
  'dinq.new': { en: 'New', rw: 'Bishya', fr: 'Nouveau' },
  'dinq.advertising': { en: 'Advertising', rw: 'Kwamamaza', fr: 'Publicité' },
  'dinq.contact': { en: 'Contact', rw: 'Twandikire', fr: 'Contact' },
  'dinq.closed': { en: 'Closed', rw: 'Byafunzwe', fr: 'Clôturé' },
  'dinq.inProgress': { en: 'In progress', rw: 'Biracyakorwa', fr: 'En cours' },
  'dinq.set': { en: 'Set', rw: 'Shyiraho', fr: 'Définir' },
  'dinq.subject': { en: 'Subject', rw: 'Ingingo', fr: 'Objet' },
  'dinq.placement': { en: 'Placement', rw: 'Aho bishyirwa', fr: 'Emplacement' },
  'dinq.budget': { en: 'Budget', rw: 'Ingengo y’imari', fr: 'Budget' },
  'dinq.nothingHere': { en: 'Nothing here', rw: 'Nta kintu kiri hano', fr: 'Rien ici' },
  'dinq.nothingBody': {
    en: 'Inquiries from the Advertise and Contact forms will appear here.',
    rw: 'Ibibazo biva ku mafishi yo Kwamamaza no Twandikire bizagaragara hano.',
    fr: 'Les demandes des formulaires Publicité et Contact apparaîtront ici.',
  },

  // — Dashboard Overview —
  'dov.subtitleAdmin': {
    en: 'Frame Africa at a glance — the whole system.',
    rw: 'Frame Africa muri rusange — sisitemu yose.',
    fr: 'Frame Africa en un coup d’œil — tout le système.',
  },
  'dov.subtitleStaff': {
    en: 'Your newsroom at a glance.',
    rw: 'Inzu yawe y’amakuru muri rusange.',
    fr: 'Votre rédaction en un coup d’œil.',
  },
  'dov.systemOverview': {
    en: 'System overview',
    rw: 'Incamake ya sisitemu',
    fr: 'Aperçu du système',
  },
  'dov.openMonitor': {
    en: 'Open monitor →',
    rw: 'Fungura ugukurikirana →',
    fr: 'Ouvrir la supervision →',
  },
  'dov.users': { en: 'Users', rw: 'Abakoresha', fr: 'Utilisateurs' },
  'dov.published': { en: 'Published', rw: 'Byatangajwe', fr: 'Publiés' },
  'dov.inPipeline': { en: 'In pipeline', rw: 'Biri mu nzira', fr: 'En production' },
  'dov.flaggedComments': {
    en: 'Flagged comments',
    rw: 'Ibitekerezo byatanzweho ikirego',
    fr: 'Commentaires signalés',
  },
  'dov.newThisWeek': {
    en: 'new this week',
    rw: 'bashya iki cyumweru',
    fr: 'nouveaux cette semaine',
  },
  'dov.inPipelineHint': { en: 'in pipeline', rw: 'biri mu nzira', fr: 'en production' },
  'dov.draftsReady': { en: 'drafts → ready', rw: 'imishinga → biteguye', fr: 'brouillons → prêts' },
  'dov.visible': { en: 'visible', rw: 'bigaragara', fr: 'visibles' },
  'dov.yourWork': { en: 'Your work', rw: 'Akazi kawe', fr: 'Votre travail' },
  'dov.myStories': { en: 'My stories', rw: 'Inkuru zanjye', fr: 'Mes articles' },
  'dov.drafting': { en: 'Drafting', rw: 'Kwandika', fr: 'En rédaction' },
  'dov.inReview': { en: 'In review', rw: 'Birasuzumwa', fr: 'En relecture' },
  'dov.awaitingReview': {
    en: 'Awaiting review',
    rw: 'Bitegereje isuzuma',
    fr: 'En attente de relecture',
  },
  'dov.openQueue': { en: 'Open queue →', rw: 'Fungura urutonde →', fr: 'Ouvrir la file →' },
  'dov.nothingReview': {
    en: 'Nothing is waiting for review.',
    rw: 'Nta kintu gitegereje isuzuma.',
    fr: 'Rien en attente de relecture.',
  },
  'dov.review': { en: 'Review', rw: 'Suzuma', fr: 'Relire' },
  'dov.recentStories': { en: 'Recent stories', rw: 'Inkuru ziheruka', fr: 'Articles récents' },
  'dov.allStories': { en: 'All stories →', rw: 'Inkuru zose →', fr: 'Tous les articles →' },
  'dov.noStoriesYet': {
    en: 'You have no stories yet.',
    rw: 'Nta nkuru ufite kugeza ubu.',
    fr: 'Vous n’avez pas encore d’articles.',
  },
  'dov.writeFirst': {
    en: 'Write your first one.',
    rw: 'Andika iyawe ya mbere.',
    fr: 'Rédigez le premier.',
  },
  'dov.updated': { en: 'updated', rw: 'byavuguruwe', fr: 'mis à jour' },

  // — Article workflow statuses (StatusBadge) —
  'dstat.draft': { en: 'draft', rw: 'umushinga', fr: 'brouillon' },
  'dstat.assigned': { en: 'assigned', rw: 'byahawe', fr: 'assigné' },
  'dstat.in_progress': { en: 'in progress', rw: 'biracyakorwa', fr: 'en cours' },
  'dstat.copy_edit': { en: 'copy desk', rw: 'gukosora', fr: 'secrétariat' },
  'dstat.fact_check': { en: 'fact check', rw: 'kugenzura ukuri', fr: 'vérification' },
  'dstat.legal': { en: 'legal', rw: 'amategeko', fr: 'juridique' },
  'dstat.ready': { en: 'ready', rw: 'biteguye', fr: 'prêt' },
  'dstat.scheduled': { en: 'scheduled', rw: 'byateganyijwe', fr: 'programmé' },
  'dstat.embargoed': { en: 'scheduled', rw: 'byateganyijwe', fr: 'programmé' },
  'dstat.published': { en: 'published', rw: 'byatangajwe', fr: 'publié' },
  'dstat.correction_pending': { en: 'correction', rw: 'igikosorwa', fr: 'correction' },
  'dstat.archived': { en: 'archived', rw: 'byabitswe', fr: 'archivé' },
  'dstat.rejected': { en: 'rejected', rw: 'byanzwe', fr: 'rejeté' },

  // — Keys referenced by public auth/article pages (added to unblock build) —
  'nav.home': { en: 'Home', rw: 'Ahabanza', fr: 'Accueil' },
  'auth.account': { en: 'Account', rw: 'Konti', fr: 'Compte' },
  'auth.forgotPasswordSubtitle': {
    en: 'Enter your email and we’ll send you a reset link.',
    rw: 'Andika email yawe tukoherereze umuyoboro wo guhindura ijambobanga.',
    fr: 'Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.',
  },

  // — Moderation dashboard —
  'dmod.keep': { en: 'Keep', rw: 'Gumana', fr: 'Garder' },
  'dmod.hide': { en: 'Hide', rw: 'Hisha', fr: 'Masquer' },
  'dmod.remove': { en: 'Remove', rw: 'Kuraho', fr: 'Retirer' },
  'dmod.delete': { en: 'Delete', rw: 'Siba', fr: 'Supprimer' },
  'dmod.deleteConfirm': {
    en: 'Delete this comment permanently?',
    rw: 'Gusiba iki gitekerezo burundu?',
    fr: 'Supprimer ce commentaire définitivement ?',
  },
  'dmod.empty': {
    en: 'Nothing to moderate — the queue is clear.',
    rw: 'Nta kigenzurwa — urutonde ruriho.',
    fr: 'Rien à modérer — la file est vide.',
  },
  'dmod.banned': { en: 'banned', rw: 'yabujijwe', fr: 'banni' },
  'dmod.on': { en: 'on', rw: 'kuri', fr: 'sur' },
  'dmod.reports': { en: 'reports', rw: 'ibirego', fr: 'signalements' },
  'dmod.banAuthor': { en: 'Ban author', rw: 'Buza umwanditsi', fr: 'Bannir l’auteur' },
  'dmod.unbanAuthor': { en: 'Unban author', rw: 'Kurekura umwanditsi', fr: 'Débannir l’auteur' },
  'cstat.visible': { en: 'visible', rw: 'kigaragara', fr: 'visible' },
  'cstat.pending': { en: 'pending', rw: 'gitegereje', fr: 'en attente' },
  'cstat.hidden': { en: 'hidden', rw: 'cyahishwe', fr: 'masqué' },
  'cstat.removed': { en: 'removed', rw: 'cyakuweho', fr: 'retiré' },

  // — Settings dashboard —
  'dset.notSet': { en: 'Not set', rw: 'Ntabwo bishyizweho', fr: 'Non défini' },
  'dset.configured': { en: 'Configured', rw: 'Byashyizweho', fr: 'Configuré' },
  'dset.environment': { en: 'Environment', rw: 'Uburyo', fr: 'Environnement' },
  'dset.update': { en: 'Update', rw: 'Vugurura', fr: 'Mettre à jour' },
  'dset.setKey': { en: 'Set key', rw: 'Shyiraho urufunguzo', fr: 'Définir la clé' },
  'dset.remove': { en: 'Remove', rw: 'Kuraho', fr: 'Retirer' },
  'dset.pasteKey': { en: 'Paste the key…', rw: 'Shyiramo urufunguzo…', fr: 'Collez la clé…' },
  'dset.addCustomKey': {
    en: 'Add a custom key',
    rw: 'Ongeraho urufunguzo rwihariye',
    fr: 'Ajouter une clé personnalisée',
  },
  'dset.addCustomDesc': {
    en: 'For any integration not listed above. Use UPPER_SNAKE_CASE.',
    rw: 'Ku byifashishwa bitari ku rutonde hejuru. Koresha UPPER_SNAKE_CASE.',
    fr: 'Pour toute intégration non listée. Utilisez UPPER_SNAKE_CASE.',
  },
  'dset.value': { en: 'Value', rw: 'Agaciro', fr: 'Valeur' },
  'dset.subtitle': {
    en: 'Integration keys and site configuration — admin-only, stored server-side.',
    rw: 'Impfunguzo z’ibyifashishwa n’imiterere y’urubuga — abayobozi gusa, bibikwa kuri seriveri.',
    fr: 'Clés d’intégration et configuration du site — réservé aux admins, stocké côté serveur.',
  },
  'dset.of': { en: 'of', rw: 'kuri', fr: 'sur' },
  'dset.integrationsConfigured': {
    en: 'integrations configured',
    rw: 'ibyifashishwa byashyizweho',
    fr: 'intégrations configurées',
  },

  // — Article admin actions —
  'daa.admin': { en: 'Admin', rw: 'Umuyobozi', fr: 'Admin' },
  'daa.publishNow': { en: 'Publish now', rw: 'Tangaza nonaha', fr: 'Publier maintenant' },
  'daa.archive': { en: 'Archive', rw: 'Bika', fr: 'Archiver' },
  'daa.deleteConfirm': {
    en: 'Delete this article? It moves to Trash and can be restored.',
    rw: 'Gusiba iyi nkuru? Ijya mu myanda kandi ishobora kugarurwa.',
    fr: 'Supprimer cet article ? Il ira à la corbeille et pourra être restauré.',
  },

  // — Shared pagination —
  'dpg.prev': { en: 'Prev', rw: 'Ibanjirije', fr: 'Préc.' },
  'dpg.next': { en: 'Next', rw: 'Ikurikira', fr: 'Suiv.' },
  'dpg.page': { en: 'Page', rw: 'Urupapuro', fr: 'Page' },
  'dpg.of': { en: 'of', rw: 'kuri', fr: 'sur' },

  // — Audit log dashboard —
  'daud.allActions': { en: 'All actions', rw: 'Ibikorwa byose', fr: 'Toutes les actions' },
  'daud.searchPlaceholder': {
    en: 'Search actor, action, target…',
    rw: 'Shakisha ukoze, igikorwa, intego…',
    fr: 'Rechercher acteur, action, cible…',
  },
  'daud.when': { en: 'When', rw: 'Igihe', fr: 'Quand' },
  'daud.actor': { en: 'Actor', rw: 'Uwabikoze', fr: 'Acteur' },
  'daud.action': { en: 'Action', rw: 'Igikorwa', fr: 'Action' },
  'daud.target': { en: 'Target', rw: 'Intego', fr: 'Cible' },
  'daud.system': { en: 'System', rw: 'Sisitemu', fr: 'Système' },
  'daud.noEntries': {
    en: 'No matching audit entries.',
    rw: 'Nta byanditswe bihuye.',
    fr: 'Aucune entrée d’audit correspondante.',
  },
  'daud.accountErased': { en: 'Account erased', rw: 'Konti yasibwe', fr: 'Compte effacé' },
  'daud.rolesChanged': { en: 'Roles changed', rw: 'Inshingano zahinduwe', fr: 'Rôles modifiés' },
  'daud.statusChanged': {
    en: 'Status changed',
    rw: 'Uko bihagaze byahinduwe',
    fr: 'Statut modifié',
  },
  'd.common.cancel': { en: 'Cancel', rw: 'Kureka', fr: 'Annuler' },

  // — Taxonomy dashboard —
  'dtax.subtitle': {
    en: 'Manage the sections, sub-sections, and topics that organise the whole site.',
    rw: 'Genzura ibice, uduce, n’insanganyamatsiko bitunganya urubuga rwose.',
    fr: 'Gérez les sections, sous-sections et sujets qui organisent tout le site.',
  },
  'dtax.sections': { en: 'Sections', rw: 'Ibice', fr: 'Sections' },
  'dtax.topics': { en: 'Topics', rw: 'Insanganyamatsiko', fr: 'Sujets' },
  'dtax.section': { en: 'section', rw: 'igice', fr: 'section' },
  'dtax.topic': { en: 'topic', rw: 'insanganyamatsiko', fr: 'sujet' },
  'dtax.newSectionName': {
    en: 'New section name',
    rw: 'Izina ry’igice gishya',
    fr: 'Nom de la nouvelle section',
  },
  'dtax.newTopicName': {
    en: 'New topic name',
    rw: 'Izina ry’insanganyamatsiko nshya',
    fr: 'Nom du nouveau sujet',
  },
  'dtax.filterTopics': {
    en: 'Filter topics…',
    rw: 'Shungura insanganyamatsiko…',
    fr: 'Filtrer les sujets…',
  },
  'dtax.topLevel': { en: '— top level —', rw: '— urwego rwo hejuru —', fr: '— niveau supérieur —' },
  'dtax.under': { en: 'under', rw: 'munsi ya', fr: 'sous' },
  'dtax.noSections': {
    en: 'No sections yet.',
    rw: 'Nta bice birahaba.',
    fr: 'Aucune section pour le moment.',
  },
  'dtax.noTopics': {
    en: 'No topics yet.',
    rw: 'Nta nsanganyamatsiko zirahaba.',
    fr: 'Aucun sujet pour le moment.',
  },
  'dtax.noTopicsMatch': {
    en: 'No topics match.',
    rw: 'Nta nsanganyamatsiko zihuye.',
    fr: 'Aucun sujet correspondant.',
  },
  'dtax.rename': { en: 'Rename', rw: 'Guhindura izina', fr: 'Renommer' },
  'dtax.article': { en: 'article', rw: 'inkuru', fr: 'article' },
  'dtax.sub': { en: 'sub', rw: 'agace', fr: 'sous' },

  // — Roles —
  'drole.journalist': { en: 'journalist', rw: 'umunyamakuru', fr: 'journaliste' },
  'drole.sub_editor': {
    en: 'sub editor',
    rw: 'umwungirije w’umwanditsi',
    fr: 'secrétaire de rédaction',
  },
  'drole.photographer': { en: 'photographer', rw: 'umufotozi', fr: 'photographe' },
  'drole.editor': { en: 'editor', rw: 'umwanditsi', fr: 'rédacteur' },
  'drole.moderator': { en: 'moderator', rw: 'umugenzuzi', fr: 'modérateur' },
  'drole.ads_manager': { en: 'ads manager', rw: 'ushinzwe kwamamaza', fr: 'gestionnaire pub' },
  'drole.admin': { en: 'admin', rw: 'umuyobozi', fr: 'admin' },
  'drole.reader': { en: 'reader', rw: 'umusomyi', fr: 'lecteur' },

  // — Users dashboard —
  'dusr.subtitle': {
    en: 'Create accounts, assign roles, and manage access.',
    rw: 'Fungura konti, tanga inshingano, kandi ugenzure uburenganzira.',
    fr: 'Créez des comptes, attribuez des rôles et gérez les accès.',
  },
  'dusr.tabAll': { en: 'All', rw: 'Bose', fr: 'Tous' },
  'dusr.tabActive': { en: 'Active', rw: 'Bakora', fr: 'Actifs' },
  'dusr.tabSuspended': { en: 'Suspended', rw: 'Bahagaritswe', fr: 'Suspendus' },
  'dusr.tabStaff': { en: 'Staff', rw: 'Abakozi', fr: 'Personnel' },
  'dusr.tabReaders': { en: 'Readers', rw: 'Abasomyi', fr: 'Lecteurs' },
  'dusr.createUser': { en: 'Create a user', rw: 'Fungura umukoresha', fr: 'Créer un utilisateur' },
  'dusr.creating': { en: 'Creating…', rw: 'Kurema…', fr: 'Création…' },
  'dusr.namePlaceholder': { en: 'Jane Uwase', rw: 'Jane Uwase', fr: 'Jane Uwase' },
  'dusr.searchPlaceholder': {
    en: 'Search name, email, role…',
    rw: 'Shakisha izina, email, inshingano…',
    fr: 'Rechercher nom, e-mail, rôle…',
  },
  'dusr.filterUsers': {
    en: 'Filter users',
    rw: 'Shungura abakoresha',
    fr: 'Filtrer les utilisateurs',
  },
  'dusr.user': { en: 'User', rw: 'Umukoresha', fr: 'Utilisateur' },
  'dusr.roles': { en: 'Roles', rw: 'Inshingano', fr: 'Rôles' },
  'dusr.status': { en: 'Status', rw: 'Uko ahagaze', fr: 'Statut' },
  'dusr.lastActive': { en: 'Last active', rw: 'Aheruka gukora', fr: 'Dernière activité' },
  'dusr.actions': { en: 'Actions', rw: 'Ibikorwa', fr: 'Actions' },
  'dusr.active': { en: 'active', rw: 'akora', fr: 'actif' },
  'dusr.suspended': { en: 'suspended', rw: 'yahagaritswe', fr: 'suspendu' },
  'dusr.deleted': { en: 'deleted', rw: 'yasibwe', fr: 'supprimé' },
  'dusr.suspend': { en: 'Suspend', rw: 'Hagarika', fr: 'Suspendre' },
  'dusr.activate': { en: 'Activate', rw: 'Kora', fr: 'Activer' },
  'dusr.noMatch': {
    en: 'No users match your search.',
    rw: 'Nta bakoresha bahuye n’ubushakashatsi bwawe.',
    fr: 'Aucun utilisateur ne correspond à votre recherche.',
  },
  'dusr.noUsers': {
    en: 'No users here.',
    rw: 'Nta bakoresha bahari.',
    fr: 'Aucun utilisateur ici.',
  },
  'dusr.createDesc': {
    en: 'A temporary password is generated. Hand it to the person — they set their own at first sign-in.',
    rw: 'Ijambobanga ry’agateganyo rirakorwa. Rihe uwo muntu — bishyiriraho iryabo ku nshuro ya mbere binjiye.',
    fr: 'Un mot de passe temporaire est généré. Remettez-le à la personne — elle définira le sien à la première connexion.',
  },
  'dusr.accountCreatedFor': {
    en: 'Account created for',
    rw: 'Konti yafunguriwe',
    fr: 'Compte créé pour',
  },
  'dusr.tempPassword': {
    en: 'Temporary password (shown once):',
    rw: 'Ijambobanga ry’agateganyo (rigaragara rimwe):',
    fr: 'Mot de passe temporaire (affiché une fois) :',
  },
  'dusr.dismiss': { en: 'Dismiss', rw: 'Funga', fr: 'Fermer' },
  'dusr.email': { en: 'Email', rw: 'Email', fr: 'E-mail' },
  'dusr.displayName': { en: 'Display name', rw: 'Izina rigaragara', fr: 'Nom affiché' },
  'dusr.invited': { en: 'Invited', rw: 'Yatumiwe', fr: 'Invité' },
  'dusr.resetPassword': { en: 'Reset password', rw: 'Hindura ijambobanga', fr: 'Réinitialiser' },
  'dusr.passwordEmailedTo': {
    en: 'New password emailed to',
    rw: 'Ijambobanga rishya ryoherejwe kuri',
    fr: 'Nouveau mot de passe envoyé à',
  },
  'dusr.cancel': { en: 'cancel', rw: 'kureka', fr: 'annuler' },

  // — Dashboard pages (headings, subtitles, empty states) —
  'dpage.total': { en: 'total', rw: 'byose', fr: 'au total' },
  'dpage.newCount': { en: 'new', rw: 'bishya', fr: 'nouveaux' },
  'dpage.contact': { en: 'Contact', rw: 'Aho bamugeraho', fr: 'Contact' },
  'dpage.tipsSubtitle': {
    en: 'Confidential tips from the public —',
    rw: 'Amakuru y’ibanga ava mu baturage —',
    fr: 'Informations confidentielles du public —',
  },
  'dpage.noTips': { en: 'No tips yet', rw: 'Nta makuru arahaba', fr: 'Aucune info pour le moment' },
  'dpage.tipsLandHere': {
    en: 'Public tips will land here.',
    rw: 'Amakuru ava mu baturage azagera hano.',
    fr: 'Les infos du public arriveront ici.',
  },
  'dpage.copydeskSubtitle': {
    en: 'Submitted stories waiting for a copy-edit —',
    rw: 'Inkuru zoherejwe zitegereje gukosorwa —',
    fr: 'Articles soumis en attente de relecture —',
  },
  'dpage.copydeskSuffix': {
    en: 'in the queue. Polish the copy, then pass it to the editors or send it back to the writer.',
    rw: 'ziri ku rutonde. Nozamo inyandiko, hanyuma uyoherereze abanditsi cyangwa uyisubize uwayanditse.',
    fr: 'dans la file. Peaufinez le texte, puis transmettez-le aux rédacteurs ou renvoyez-le à l’auteur.',
  },
  'dpage.copyDeskClear': {
    en: 'The copy desk is clear',
    rw: 'Ibiro byo gukosora birarangiye',
    fr: 'Le secrétariat de rédaction est vide',
  },
  'dpage.nothingCopyEdit': {
    en: 'Nothing is waiting for a copy-edit.',
    rw: 'Nta kintu gitegereje gukosorwa.',
    fr: 'Rien en attente de relecture.',
  },
  'dpage.adStudio': { en: 'Ad Studio', rw: 'Studio yo Kwamamaza', fr: 'Studio Pub' },
  'dpage.adStudioSubtitle': {
    en: 'Design a static creative at the exact IAB size, or drop in a video / GIF ad — then publish it straight into a live slot.',
    rw: 'Kora ishusho ku ngano ya IAB, cyangwa ushyiremo ishusho igenda / GIF — hanyuma uyitangaze mu mwanya ukora.',
    fr: 'Concevez une créa statique à la taille IAB exacte, ou déposez une pub vidéo / GIF — puis publiez-la directement dans un emplacement.',
  },
  'dpage.mediaSubtitle': {
    en: 'Upload images once, then reuse them across stories. JPEG, PNG, WebP, GIF, or AVIF, up to 8 MB.',
    rw: 'Ohereza amafoto rimwe, hanyuma uyakoreshe mu nkuru. JPEG, PNG, WebP, GIF, cyangwa AVIF, kugeza kuri 8 MB.',
    fr: 'Téléversez les images une fois, puis réutilisez-les. JPEG, PNG, WebP, GIF ou AVIF, jusqu’à 8 Mo.',
  },
  'dpage.analyticsSubtitle': {
    en: 'Live story performance — anonymous page views, refreshed on load.',
    rw: 'Imikorere y’inkuru ako kanya — kureba bitazwi, bivugururwa buri gihe.',
    fr: 'Performance en direct — vues anonymes, actualisées au chargement.',
  },
  'dpage.noReferrers': {
    en: 'No external referrers yet.',
    rw: 'Nta hantu hanze harakoherezwa.',
    fr: 'Aucun référent externe pour le moment.',
  },
  'dpage.auditSubtitle': {
    en: 'A record of privileged actions — who did what, and when.',
    rw: 'Inyandiko y’ibikorwa by’uburenganzira — uwabikoze, icyo yakoze, n’igihe.',
    fr: 'Un registre des actions privilégiées — qui a fait quoi, et quand.',
  },
  'dpage.entries': { en: 'entries', rw: 'ibyanditswe', fr: 'entrées' },
  'dpage.nothingLogged': {
    en: 'Nothing logged yet',
    rw: 'Nta kintu cyanditswe',
    fr: 'Rien d’enregistré',
  },
  'dpage.adsSubtitle': {
    en: 'Manage the creatives served into labelled ad slots —',
    rw: 'Genzura amamamaza ashyirwa mu myanya —',
    fr: 'Gérez les créas diffusées dans les emplacements —',
  },
  'dpage.adsSuffix': {
    en: 'total. Images, GIFs, and videos are supported; impressions and clicks are counted.',
    rw: 'byose. Amafoto, GIF, n’amashusho birakorwa; kureba no gukanda birabarwa.',
    fr: 'au total. Images, GIF et vidéos sont pris en charge ; impressions et clics sont comptés.',
  },
  'dpage.articlesSubtitle': {
    en: 'Every article across the newsroom, any author or status — open and edit any of them, publish, archive, or delete.',
    rw: 'Inkuru zose z’inzu y’amakuru, uwanditse wese — funguza uhindure, tangaza, bika, cyangwa siba.',
    fr: 'Tous les articles de la rédaction, tout auteur ou statut — ouvrez et modifiez, publiez, archivez ou supprimez.',
  },
  'dpage.noArticles': {
    en: 'No articles yet',
    rw: 'Nta nkuru zirahaba',
    fr: 'Aucun article pour le moment',
  },
  'dpage.flyerStudio': { en: 'Flyer Studio', rw: 'Studio y’Amatangazo', fr: 'Studio Affiches' },
  'dpage.studioSubtitle': {
    en: 'Design branded flyers and social cards — start from a story or a preset, then customise every element.',
    rw: 'Kora amatangazo n’amakarita y’imbuga nkoranyambaga — tangira ku nkuru cyangwa ku cyitegererezo, hanyuma uhindure buri kintu.',
    fr: 'Concevez des affiches et cartes sociales — partez d’un article ou d’un modèle, puis personnalisez chaque élément.',
  },
  'dpage.moderationSubtitle': {
    en: 'Reported comments and anything awaiting review —',
    rw: 'Ibitekerezo byatanzweho ikirego n’ibitegereje isuzuma —',
    fr: 'Commentaires signalés et en attente de révision —',
  },
  'dpage.moderationSuffix': {
    en: 'in the queue. Keep clears the flags; Hide and Remove take it off the article.',
    rw: 'biri ku rutonde. Gumana bikuraho ibirego; Hisha na Kuraho bibikura ku nkuru.',
    fr: 'dans la file. Garder efface les signalements ; Masquer et Retirer l’enlèvent de l’article.',
  },
  'dpage.pipelineSubtitle': {
    en: 'The whole newsroom at a glance — every story by stage.',
    rw: 'Inzu y’amakuru yose muri rusange — buri nkuru ku rwego rwayo.',
    fr: 'Toute la rédaction en un coup d’œil — chaque article par étape.',
  },
  'dpage.nothingHere': { en: 'Nothing here.', rw: 'Nta kintu kiri hano.', fr: 'Rien ici.' },
  'dpage.monitorSubtitle': {
    en: 'A live snapshot of everything happening across Frame Africa.',
    rw: 'Ishusho y’ako kanya y’ibiri kuba muri Frame Africa.',
    fr: 'Un aperçu en direct de tout ce qui se passe sur Frame Africa.',
  },
  'dpage.allClear': { en: 'All clear', rw: 'Nta kibazo', fr: 'Tout est clair' },
  'dpage.nothingAwaitingReview': {
    en: 'Nothing is awaiting review right now.',
    rw: 'Nta kintu gitegereje isuzuma ubu.',
    fr: 'Rien n’attend de relecture pour le moment.',
  },
  'dpage.noStories': {
    en: 'No stories yet',
    rw: 'Nta nkuru zirahaba',
    fr: 'Aucun article pour le moment',
  },
  'dpage.editStory': { en: 'Edit story', rw: 'Hindura inkuru', fr: 'Modifier l’article' },
  'dpage.editArticle': { en: 'Edit article', rw: 'Hindura inkuru', fr: 'Modifier l’article' },
  'dpage.copyEdit': { en: 'Copy-edit', rw: 'Gukosora', fr: 'Relecture' },

  // — Analytics dashboard —
  'dana.readingNow': { en: 'Reading now', rw: 'Barasoma ubu', fr: 'Lecteurs actifs' },
  'dana.viewsToday': { en: 'Views today', rw: 'Barebye uyu munsi', fr: 'Vues aujourd’hui' },
  'dana.topStories': { en: 'Top stories', rw: 'Inkuru z’ingenzi', fr: 'Articles phares' },
  'dana.referrers': { en: 'Referrers', rw: 'Aho baturutse', fr: 'Référents' },
  'dana.last5min': { en: 'last 5 min', rw: 'iminota 5 ishize', fr: '5 dernières min' },
  'dana.sinceMidnight': { en: 'since midnight', rw: 'kuva mu gicuku', fr: 'depuis minuit' },
  'dana.rankedToday': {
    en: 'ranked today',
    rw: 'byatondetswe uyu munsi',
    fr: 'classés aujourd’hui',
  },
  'dana.fromSources': {
    en: 'from sources · 24h',
    rw: 'aho byaturutse · amasaha 24',
    fr: 'des sources · 24h',
  },
  'dana.mostReadToday': {
    en: 'Most read today',
    rw: 'Bisomwe cyane uyu munsi',
    fr: 'Les plus lus aujourd’hui',
  },
  'dana.noViewsToday': {
    en: 'No article views recorded yet today.',
    rw: 'Nta nkuru irasomwa uyu munsi.',
    fr: 'Aucune vue enregistrée aujourd’hui.',
  },
  'dana.topReferrers': {
    en: 'Top referrers (24h)',
    rw: 'Aho baturutse cyane (amasaha 24)',
    fr: 'Principaux référents (24h)',
  },
  'dpage.stories': { en: 'stories', rw: 'inkuru', fr: 'articles' },
  'dpage.awaitingDecision': {
    en: 'awaiting your decision.',
    rw: 'zitegereje icyemezo cyawe.',
    fr: 'en attente de votre décision.',
  },
  'dpage.backNewsroom': { en: '← Newsroom', rw: '← Inzu y’amakuru', fr: '← Rédaction' },
  'dpipe.draft': { en: 'Draft', rw: 'Umushinga', fr: 'Brouillon' },
  'dpipe.copyDesk': { en: 'Copy desk', rw: 'Gukosora', fr: 'Secrétariat' },
  'dpipe.review': { en: 'Review', rw: 'Isuzuma', fr: 'Relecture' },
  'dpipe.scheduled': { en: 'Scheduled', rw: 'Byateganyijwe', fr: 'Programmé' },
  'dpipe.published': { en: 'Published', rw: 'Byatangajwe', fr: 'Publié' },
  'dpipe.returned': { en: 'Returned', rw: 'Byasubijwe', fr: 'Renvoyé' },

  // — Monitor dashboard —
  'dmon.new7days': { en: 'New (7 days)', rw: 'Bashya (iminsi 7)', fr: 'Nouveaux (7 jours)' },
  'dmon.signupsWeek': {
    en: 'signups this week',
    rw: 'biyandikishije iki cyumweru',
    fr: 'inscriptions cette semaine',
  },
  'dmon.active': { en: 'active', rw: 'bakora', fr: 'actifs' },
  'dmon.suspended': { en: 'suspended', rw: 'bahagaritswe', fr: 'suspendus' },
  'dmon.recentArticles': { en: 'Recent articles', rw: 'Inkuru ziheruka', fr: 'Articles récents' },
  'dmon.recentComments': {
    en: 'Recent comments',
    rw: 'Ibitekerezo biheruka',
    fr: 'Commentaires récents',
  },
  'dmon.by': { en: 'by', rw: 'na', fr: 'par' },
  'dpage.inYourNewsroom': {
    en: 'in your newsroom.',
    rw: 'mu nzu yawe y’amakuru.',
    fr: 'dans votre rédaction.',
  },
  'dpage.startFirstStory': {
    en: 'Start your first story to see it here.',
    rw: 'Tangira inkuru yawe ya mbere kugira ngo uyibone hano.',
    fr: 'Commencez votre premier article pour le voir ici.',
  },
  'dpage.newArticle': { en: 'New article', rw: 'Inkuru nshya', fr: 'Nouvel article' },
  'dpage.backHouseAds': { en: '← House ads', rw: '← Kwamamaza', fr: '← Publicités' },
  'dpage.backAllArticles': { en: '← All articles', rw: '← Inkuru zose', fr: '← Tous les articles' },
  'dpage.backCopyDesk': { en: '← Copy desk', rw: '← Gukosora', fr: '← Secrétariat' },
  'dpage.returnedByEditor': {
    en: 'Returned by an editor',
    rw: 'Byasubijwe n’umwanditsi',
    fr: 'Renvoyé par un rédacteur',
  },
  'dpage.newStorySubtitle': {
    en: 'Write on the left; set the section, image and topics on the right, then publish.',
    rw: 'Andika ibumoso; shyiraho igice, ifoto n’insanganyamatsiko iburyo, hanyuma utangaze.',
    fr: 'Écrivez à gauche ; définissez section, image et sujets à droite, puis publiez.',
  },
  'dpage.copyEditSubtitle': {
    en: 'Fix the copy, then pass it to the editors or return it to the writer. Every save records a revision.',
    rw: 'Kosora inyandiko, hanyuma uyoherereze abanditsi cyangwa uyisubize uwayanditse. Buri kubika bihita byandikwa.',
    fr: 'Corrigez le texte, puis transmettez-le aux rédacteurs ou renvoyez-le à l’auteur. Chaque sauvegarde crée une révision.',
  },

  // — Stories table —
  'dst.drafts': { en: 'Drafts', rw: 'Imishinga', fr: 'Brouillons' },
  'dst.inReview': { en: 'In review', rw: 'Birasuzumwa', fr: 'En relecture' },
  'dst.published': { en: 'Published', rw: 'Byatangajwe', fr: 'Publiés' },
  'dst.archived': { en: 'Archived', rw: 'Byabitswe', fr: 'Archivés' },
  'dst.editStory': { en: 'Edit story', rw: 'Hindura inkuru', fr: 'Modifier l’article' },
  'dst.viewPublished': {
    en: 'View published story',
    rw: 'Reba inkuru yatangajwe',
    fr: 'Voir l’article publié',
  },
  'dst.deleteArticle': { en: 'Delete article', rw: 'Siba inkuru', fr: 'Supprimer l’article' },
  'dst.filterByStatus': {
    en: 'Filter by status',
    rw: 'Shungura uko bihagaze',
    fr: 'Filtrer par statut',
  },
  'dst.searchStories': {
    en: 'Search stories…',
    rw: 'Shakisha inkuru…',
    fr: 'Rechercher des articles…',
  },
  'dst.noMatch': {
    en: 'No stories match your search.',
    rw: 'Nta nkuru zihuye n’ibyo washatse.',
    fr: 'Aucun article ne correspond.',
  },
  'dst.nothingYet': {
    en: 'Nothing here yet.',
    rw: 'Nta kintu kirahaba.',
    fr: 'Rien pour le moment.',
  },
  'dst.story': { en: 'Story', rw: 'Inkuru', fr: 'Article' },
  'dst.section': { en: 'Section', rw: 'Igice', fr: 'Rubrique' },
  'dst.status': { en: 'Status', rw: 'Uko bihagaze', fr: 'Statut' },
  'dst.updated': { en: 'Updated', rw: 'Byavuguruwe', fr: 'Mis à jour' },
  'dst.actions': { en: 'Actions', rw: 'Ibikorwa', fr: 'Actions' },
  'dst.view': { en: 'View', rw: 'Reba', fr: 'Voir' },
  'dst.open': { en: 'Open', rw: 'Fungura', fr: 'Ouvrir' },

  // — Draft form —
  'ddf.headline': { en: 'Headline', rw: 'Umutwe', fr: 'Titre' },
  'ddf.writeHeadline': { en: 'Write the headline…', rw: 'Andika umutwe…', fr: 'Écrivez le titre…' },
  'ddf.createDraft': { en: 'Create draft', rw: 'Kora umushinga', fr: 'Créer le brouillon' },
  'ddf.saveChanges': { en: 'Save changes', rw: 'Bika impinduka', fr: 'Enregistrer' },
  'ddf.standfirst': {
    en: 'Standfirst (subtitle)',
    rw: 'Umutwe wungirije',
    fr: 'Chapeau (sous-titre)',
  },
  'ddf.articleBody': { en: 'Article body', rw: 'Umubiri w’inkuru', fr: 'Corps de l’article' },
  'ddf.changeNote': {
    en: 'Change note (optional)',
    rw: 'Icyahindutse (bitegetswe)',
    fr: 'Note de modification (facultatif)',
  },
  'ddf.publish': { en: 'Publish', rw: 'Gutangaza', fr: 'Publication' },
  'ddf.saved': { en: 'Saved ✓', rw: 'Byabitswe ✓', fr: 'Enregistré ✓' },
  'ddf.details': { en: 'Details', rw: 'Ibisobanuro', fr: 'Détails' },
  'ddf.section': { en: 'Section', rw: 'Igice', fr: 'Rubrique' },
  'ddf.chooseSection': {
    en: 'Choose a section…',
    rw: 'Hitamo igice…',
    fr: 'Choisir une rubrique…',
  },
  'ddf.language': { en: 'Language', rw: 'Ururimi', fr: 'Langue' },
  'ddf.premium': {
    en: 'Premium (subscribers only)',
    rw: 'Premium (abiyandikishije gusa)',
    fr: 'Premium (abonnés uniquement)',
  },
  'ddf.excerpt': { en: 'Excerpt', rw: 'Incamake', fr: 'Extrait' },
  'ddf.featuredImage': { en: 'Featured image', rw: 'Ifoto y’ibanze', fr: 'Image à la une' },
  'ddf.imageUrl': { en: 'Image URL', rw: 'URL y’ifoto', fr: 'URL de l’image' },
  'ddf.altAccessibility': {
    en: 'Alt text (for accessibility)',
    rw: 'Umwandiko usimbura (ku bafite ubumuga)',
    fr: 'Texte alternatif (accessibilité)',
  },
  'ddf.credit': { en: 'Credit', rw: 'Uwabikoze', fr: 'Crédit' },
  'ddf.topics': { en: 'Topics', rw: 'Insanganyamatsiko', fr: 'Sujets' },

  // — Media upload / grid / picker —
  'dmu.imageFile': { en: 'Image file', rw: 'Dosiye y’ifoto', fr: 'Fichier image' },
  'dmg.copyUrl': { en: 'Copy URL', rw: 'Kopera URL', fr: 'Copier l’URL' },
  'dmg.deleteImage': { en: 'Delete image', rw: 'Siba ifoto', fr: 'Supprimer l’image' },
  'dmg.noAltText': {
    en: 'No alt text',
    rw: 'Nta mwandiko usimbura',
    fr: 'Pas de texte alternatif',
  },
  'dmg.searchImages': {
    en: 'Search images…',
    rw: 'Shakisha amafoto…',
    fr: 'Rechercher des images…',
  },
  'dmg.noImagesMatch': {
    en: 'No images match your search.',
    rw: 'Nta mafoto ahuye n’ibyo washatse.',
    fr: 'Aucune image ne correspond.',
  },
  'dmp.chooseFromLibrary': {
    en: 'Choose from library',
    rw: 'Hitamo mu bubiko',
    fr: 'Choisir dans la médiathèque',
  },
  'dmp.untitled': { en: 'Untitled', rw: 'Nta mutwe', fr: 'Sans titre' },

  // — Live composer —
  'dlc.posting': { en: 'Posting…', rw: 'Kohereza…', fr: 'Publication…' },
  'dlc.postUpdate': { en: 'Post update', rw: 'Ohereza ivugurura', fr: 'Publier la mise à jour' },
  'dlc.headlineOptional': {
    en: 'Headline (optional)',
    rw: 'Umutwe (bitegetswe)',
    fr: 'Titre (facultatif)',
  },
  'dlc.postPlaceholder': {
    en: 'Post an update — readers see it appear live…',
    rw: 'Ohereza ivugurura — abasomyi barabibona ako kanya…',
    fr: 'Publiez une mise à jour — les lecteurs la voient en direct…',
  },

  // — Correction form —
  'dcf.adding': { en: 'Adding…', rw: 'Kongeraho…', fr: 'Ajout…' },
  'dcf.addCorrection': {
    en: 'Add correction',
    rw: 'Ongeraho igikosorwa',
    fr: 'Ajouter une correction',
  },
  'dcf.placeholder': {
    en: 'e.g. An earlier version misstated the date. It has been corrected.',
    rw: 'urugero: Verisiyo ibanza yari yanditse itariki nabi. Yarakosowe.',
    fr: 'ex. Une version antérieure indiquait une date erronée. Elle a été corrigée.',
  },

  // — Ad manager —
  'dam.somethingWrong': {
    en: 'Something went wrong.',
    rw: 'Hari ikitagenze neza.',
    fr: 'Une erreur est survenue.',
  },
  'dam.noHouseAds': {
    en: 'No house ads yet',
    rw: 'Nta mamamaza arahaba',
    fr: 'Aucune publicité maison',
  },
  'dam.newHouseAd': { en: 'New house ad', rw: 'Kwamamaza gushya', fr: 'Nouvelle publicité' },
  'dam.titlePlaceholder': {
    en: 'Title (shown if no image)',
    rw: 'Umutwe (ugaragara nta foto)',
    fr: 'Titre (si pas d’image)',
  },
  'dam.imagePlaceholder': {
    en: 'Image, GIF or video URL (or /uploads/… path)',
    rw: 'URL y’ifoto, GIF cyangwa ishusho (cyangwa /uploads/…)',
    fr: 'URL image, GIF ou vidéo (ou /uploads/…)',
  },
  'dam.addHouseAd': { en: 'Add house ad', rw: 'Ongeraho kwamamaza', fr: 'Ajouter la publicité' },
  'dam.pause': { en: 'Pause', rw: 'Hagarika', fr: 'Suspendre' },
  'dam.activate': { en: 'Activate', rw: 'Kora', fr: 'Activer' },
  'dam.deleteAd': { en: 'Delete ad', rw: 'Siba kwamamaza', fr: 'Supprimer la pub' },

  // — Block editor —
  'dbe.writeParagraph': {
    en: 'Write a paragraph…',
    rw: 'Andika igika…',
    fr: 'Écrivez un paragraphe…',
  },
  'dbe.subheadingText': { en: 'Subheading text', rw: 'Umutwe muto', fr: 'Sous-titre' },
  'dbe.imageUrl': {
    en: 'Image URL (https://… or /seed/…)',
    rw: 'URL y’ifoto (https://… cyangwa /seed/…)',
    fr: 'URL de l’image (https://… ou /seed/…)',
  },
  'dbe.altDescribe': {
    en: 'Alt text (describe the photo for accessibility)',
    rw: 'Umwandiko usimbura (sobanura ifoto)',
    fr: 'Texte alternatif (décrivez la photo)',
  },
  'dbe.captionOptional': {
    en: 'Caption (optional)',
    rw: 'Umutwe muto (bitegetswe)',
    fr: 'Légende (facultatif)',
  },
  'dbe.creditOptional': {
    en: 'Credit (optional)',
    rw: 'Uwabikoze (bitegetswe)',
    fr: 'Crédit (facultatif)',
  },
  'dbe.altText': { en: 'Alt text', rw: 'Umwandiko usimbura', fr: 'Texte alternatif' },
  'dbe.quoteText': { en: 'Quote text', rw: 'Amagambo yavuzwe', fr: 'Texte de la citation' },
  'dbe.attributionOptional': {
    en: 'Attribution (optional)',
    rw: 'Uwayavuze (bitegetswe)',
    fr: 'Attribution (facultatif)',
  },
  'dbe.bulleted': { en: 'Bulleted', rw: 'Utudomo', fr: 'À puces' },
  'dbe.numbered': { en: 'Numbered', rw: 'Imibare', fr: 'Numérotée' },
  'dbe.onePerLine': {
    en: 'One item per line',
    rw: 'Ikintu kimwe kuri buri murongo',
    fr: 'Un élément par ligne',
  },
  'dbe.factboxTitle': {
    en: 'Fact-box title (e.g. What to know)',
    rw: 'Umutwe w’agasanduku (urugero: Ibyo ukwiye kumenya)',
    fr: 'Titre de l’encadré (ex. À savoir)',
  },
  'dbe.explainerContext': {
    en: 'Explainer / context',
    rw: 'Ibisobanuro / imiterere',
    fr: 'Explication / contexte',
  },
  'dbe.youtubeUrl': {
    en: 'YouTube URL (watch, youtu.be, or shorts)',
    rw: 'URL ya YouTube (watch, youtu.be, cyangwa shorts)',
    fr: 'URL YouTube (watch, youtu.be ou shorts)',
  },
  'dbe.horizontalBreak': {
    en: 'A horizontal section break.',
    rw: 'Umurongo utandukanya ibice.',
    fr: 'Une séparation horizontale.',
  },
  'dbe.noBlocks': {
    en: 'No blocks yet — add one below to start the story.',
    rw: 'Nta bice birahaba — ongeraho kimwe hasi utangire inkuru.',
    fr: 'Aucun bloc — ajoutez-en un ci-dessous pour commencer.',
  },
  'dbe.moveBlockUp': { en: 'Move block up', rw: 'Zamura igice', fr: 'Monter le bloc' },
  'dbe.moveBlockDown': { en: 'Move block down', rw: 'Manura igice', fr: 'Descendre le bloc' },
  'dbe.removeBlock': { en: 'Remove block', rw: 'Kuraho igice', fr: 'Retirer le bloc' },
  'dbe.addBlock': { en: 'Add block', rw: 'Ongeraho igice', fr: 'Ajouter un bloc' },
  'dbe.paragraph': { en: 'Paragraph', rw: 'Igika', fr: 'Paragraphe' },
  'dbe.subhead': { en: 'Subhead', rw: 'Umutwe muto', fr: 'Sous-titre' },
  'dbe.image': { en: 'Image', rw: 'Ifoto', fr: 'Image' },
  'dbe.gallery': { en: 'Gallery', rw: 'Amafoto', fr: 'Galerie' },
  'dbe.pullquote': { en: 'Pull-quote', rw: 'Amagambo yatoranyijwe', fr: 'Exergue' },
  'dbe.quote': { en: 'Quote', rw: 'Amagambo', fr: 'Citation' },
  'dbe.list': { en: 'List', rw: 'Urutonde', fr: 'Liste' },
  'dbe.factbox': { en: 'Fact-box', rw: 'Agasanduku k’ibyukuri', fr: 'Encadré' },
  'dbe.video': { en: 'Video', rw: 'Ishusho', fr: 'Vidéo' },
  'dbe.divider': { en: 'Divider', rw: 'Umurongo', fr: 'Séparateur' },
  'dbe.lede': {
    en: 'Lede (larger opening paragraph)',
    rw: 'Intangiriro (igika cya mbere kinini)',
    fr: 'Chapeau (paragraphe d’ouverture)',
  },
  'dbe.removeGalleryImage': {
    en: 'Remove gallery image',
    rw: 'Kuraho ifoto',
    fr: 'Retirer l’image',
  },
  'dcf.heading': {
    en: 'Add a correction',
    rw: 'Ongeraho igikosorwa',
    fr: 'Ajouter une correction',
  },
  'dlc.endCoverage': { en: 'End coverage', rw: 'Soza ikurikirana', fr: 'Terminer la couverture' },
  'dlc.keyEvent': {
    en: 'Mark as a key event',
    rw: 'Shyiraho nk’igikorwa cy’ingenzi',
    fr: 'Marquer comme événement clé',
  },
  'dst.premium': { en: 'Premium', rw: 'Premium', fr: 'Premium' },
  'dam.video': { en: 'Video', rw: 'Ishusho', fr: 'Vidéo' },
  'dam.livePaused': {
    en: 'Live & paused',
    rw: 'Bikora & byahagaritswe',
    fr: 'Actives et suspendues',
  },
  'dam.createHint': {
    en: 'Create one on the right, or design one in the Ad Studio.',
    rw: 'Kora rimwe iburyo, cyangwa uripange muri Studio yo Kwamamaza.',
    fr: 'Créez-en une à droite, ou concevez-la dans le Studio Pub.',
  },
  'dam.formats': {
    en: 'jpg · png · gif · mp4 · webm — videos autoplay muted & loop',
    rw: 'jpg · png · gif · mp4 · webm — amashusho atangira wenyine adafite ijwi',
    fr: 'jpg · png · gif · mp4 · webm — les vidéos démarrent en muet, en boucle',
  },
  'dam.impressions': { en: 'impr', rw: 'kurebwa', fr: 'impr' },
  'dam.clicks': { en: 'clicks', rw: 'gukandwa', fr: 'clics' },
  'das.downloadPng': { en: 'Download PNG', rw: 'Kuramo PNG', fr: 'Télécharger le PNG' },
  'das.templates': { en: 'Templates', rw: 'Ibyitegererezo', fr: 'Modèles' },
  'dsc.wrapQuotes': {
    en: 'Wrap the headline in quote marks',
    rw: 'Shyira umutwe mu tugereranyo',
    fr: 'Mettre le titre entre guillemets',
  },
  'dsc.remove': { en: 'Remove', rw: 'Kuraho', fr: 'Retirer' },
  'dsc.dropShadow': {
    en: 'Drop shadow behind text',
    rw: 'Igicucu inyuma y’umwandiko',
    fr: 'Ombre portée derrière le texte',
  },
  'dash.closeMenu': { en: 'Close menu', rw: 'Funga menu', fr: 'Fermer le menu' },
  'dash.newActivity': {
    en: 'New activity will appear here',
    rw: 'Ibikorwa bishya bizagaragara hano',
    fr: 'La nouvelle activité apparaîtra ici',
  },

  // — Ad studio / Flyer studio —
  'das.top': { en: 'Top', rw: 'Hejuru', fr: 'Haut' },
  'das.center': { en: 'Center', rw: 'Hagati', fr: 'Centre' },
  'das.bottom': { en: 'Bottom', rw: 'Hasi', fr: 'Bas' },
  'dsc.startFromStory': {
    en: 'Start from a story',
    rw: 'Tangira ku nkuru',
    fr: 'Partir d’un article',
  },
  'dsc.choosePublished': {
    en: 'Choose a published story…',
    rw: 'Hitamo inkuru yatangajwe…',
    fr: 'Choisir un article publié…',
  },
  'dsc.kicker': { en: 'Kicker', rw: 'Akamenyetso', fr: 'Surtitre' },
  'dsc.headline': { en: 'Headline', rw: 'Umutwe', fr: 'Titre' },
  'dsc.source': { en: 'Source', rw: 'Aho byavuye', fr: 'Source' },
  'dsc.ctaPill': { en: 'CTA pill', rw: 'Buto y’ubutumire', fr: 'Bouton d’action' },
  'dsc.ctaPlaceholder': {
    en: 'e.g. Read more',
    rw: 'urugero: Soma byinshi',
    fr: 'ex. Lire la suite',
  },
  'dsc.overlayStyle': {
    en: 'Overlay style',
    rw: 'Uburyo bw’igipfukisho',
    fr: 'Style de superposition',
  },
  'dsc.backgroundColour': { en: 'Background colour', rw: 'Ibara ry’inyuma', fr: 'Couleur de fond' },
  'dsc.align': { en: 'Align', rw: 'Gutondeka', fr: 'Alignement' },
  'dsc.position': { en: 'Position', rw: 'Aho biri', fr: 'Position' },
  'dsc.backdropColour': {
    en: 'Backdrop colour',
    rw: 'Ibara ry’inyuma y’umwandiko',
    fr: 'Couleur du fond de texte',
  },
  'dsc.text': { en: 'Text', rw: 'Umwandiko', fr: 'Texte' },
  'dsc.accent': { en: 'Accent', rw: 'Ibara ry’ingenzi', fr: 'Accent' },
  'dsc.handle': { en: 'Handle', rw: 'Izina rya konti', fr: 'Identifiant' },
  'dsc.showPlatforms': {
    en: 'Show platforms',
    rw: 'Erekana imbuga',
    fr: 'Afficher les plateformes',
  },
  'dsc.customColour': { en: 'custom colour', rw: 'ibara wihitiyemo', fr: 'couleur personnalisée' },
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

/** Translate a category/section name based on its slug. Fall back to name if no key matches. */
export function translateCategory(locale: Locale, slug: string, defaultName: string): string {
  const key = `category.${slug}` as MessageKey;
  const entry = dict[key];
  if (entry) {
    return entry[locale] ?? entry.en ?? defaultName;
  }
  return defaultName;
}
