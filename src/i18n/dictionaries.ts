import type { Locale } from "./config";

type Dict = {
  nav: {
    home: string;
    about: string;
    how: string;
    media: string;
    blog: string;
    contact: string;
    join: string;
  };
  how: {
    eyebrow: string;
    title: string;
    intro: string;
    nonProfitTitle: string;
    nonProfitBody: string;
    consumptionBadge: string;
    howItWorksTitle: string;
    howItWorksBody: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    activitiesTitle: string;
    activitiesSubtitle: string;
    weekly: string;
    monthly: string;
    yearly: string;
    occasional: string;
    activityWeekly1Title: string;
    activityWeekly1Body: string;
    activityOccasional1Title: string;
    activityOccasional1Body: string;
    activityMonthly1Title: string;
    activityMonthly1Body: string;
    activityMonthly2Title: string;
    activityMonthly2Body: string;
    activityYearly1Title: string;
    activityYearly1Body: string;
    activityYearly2Title: string;
    activityYearly2Body: string;
    activityYearly3Title: string;
    activityYearly3Body: string;
    communitiesEyebrow: string;
    communitiesTitle: string;
    communitiesIntro: string;
    community1Title: string;
    community1Body: string;
    community1Tag: string;
    community2Title: string;
    community2Body: string;
    community2Tag: string;
    community3Title: string;
    community3Body: string;
    community3Tag: string;
    community4Title: string;
    community4Body: string;
    community4Tag: string;
    memberEyebrow: string;
    memberTitle: string;
    memberSubtitle: string;
    memberFlipHint: string;
    benefit1Title: string;
    benefit1Body: string;
    benefit2Title: string;
    benefit2Body: string;
    benefit3Title: string;
    benefit3Body: string;
    benefit4Title: string;
    benefit4Body: string;
    memberCtaTitle: string;
    memberCtaBody: string;
    memberCta: string;
  };
  media: {
    eyebrow: string;
    title: string;
    intro: string;
    pressTitle: string;
    pressSubtitle: string;
    visitArticle: string;
    instagramTitle: string;
    instagramSubtitle: string;
    instagramCta: string;
    loading: string;
    noPreview: string;
  };
  home: {
    eyebrow: string;
    titleA: string;
    titleHighlight: string;
    titleB: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    pillarsTitle: string;
    pillarsSubtitle: string;
    pillar1Title: string;
    pillar1Body: string;
    pillar2Title: string;
    pillar2Body: string;
    pillar3Title: string;
    pillar3Body: string;
    eventsTitle: string;
    eventsSubtitle: string;
    eventsCta: string;
    eventsEmpty: string;
    eventJoin: string;
    reasonsEyebrow: string;
    reasonsTitle: string;
    reason1: string;
    reason2: string;
    reason3: string;
    reason4: string;
    reason5: string;
    statsTitle: string;
    statAttendees: string;
    statGames: string;
    statHours: string;
    statGrowth: string;
    statMembers: string;
    statUpcoming: string;
    statRating: string;
    joinTitle: string;
    joinSubtitle: string;
    testimonialsEyebrow: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    testimonialsMeetup: string;
    testimonialsGoogle: string;
  };
  footer: {
    tagline: string;
    sections: string;
    follow: string;
    contact: string;
    rights: string;
    location: string;
  };
  about: {
    eyebrow: string;
    title: string;
    intro: string;
    storyTitle: string;
    storyP1: string;
    storyP2: string;
    valuesTitle: string;
    value1Title: string;
    value1Body: string;
    value2Title: string;
    value2Body: string;
    value3Title: string;
    value3Body: string;
    activitiesTitle: string;
    weekly: string;
    monthly: string;
    yearly: string;
    occasional: string;
    teamTitle: string;
    teamSubtitle: string;
    communitiesTitle: string;
    partnersTitle: string;
    partnersAssociations: string;
    partnersShops: string;
    partnersPublishers: string;
    pressTitle: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submit: string;
    success: string;
    or: string;
    findUs: string;
  };
};

const es: Dict = {
  nav: {
    home: "Inicio",
    about: "Quiénes somos",
    how: "Cómo funciona",
    media: "Media",
    blog: "Blog",
    contact: "Contacto",
    join: "Únete",
  },
  home: {
    eyebrow: "La comunidad de juegos de mesa más grande de Europa",
    titleA: "Juegos de mesa,",
    titleHighlight: "buen rollo",
    titleB: "y Barcelona.",
    subtitle:
      "Cada semana nos reunimos en l'Estació de França para reír, conocer gente y descubrir más de 300 juegos de mesa. No hace falta saber jugar — te lo explicamos.",
    ctaPrimary: "Apúntate a la próxima Game Night",
    ctaSecondary: "Conócenos",
    pillarsTitle: "Por qué nace KLEFF",
    pillarsSubtitle: "Tres pilares que sostienen todo lo que hacemos.",
    pillar1Title: "Comunidad",
    pillar1Body:
      "Más de 10.000 personas que comparten una afición. Vengas solo, en pareja o con amigos, encontrarás tu mesa.",
    pillar2Title: "Ubicación céntrica",
    pillar2Body:
      "L'Estació Espai Gastronòmic, en plena Estació de França. Con tapas, bebidas y 300 personas de aforo.",
    pillar3Title: "Buen ambiente",
    pillar3Body:
      "Inclusivo, multilingüe (ES · CAT · EN) y abierto a cualquier nivel. Aquí lo importante es pasarlo bien.",
    eventsTitle: "Próximos eventos",
    eventsSubtitle: "Lo que tenemos preparado en las próximas semanas.",
    eventsCta: "Ver todos en Meetup",
    eventsEmpty: "Estamos preparando los próximos eventos. Síguenos en Meetup para no perderte nada.",
    eventJoin: "Apuntarme",
    reasonsEyebrow: "Game Night",
    reasonsTitle: "5 razones para venir a una Game Night",
    reason1: "🎲 Disfruta de una enorme variedad de juegos (¡te enseñamos a jugar a todos!)",
    reason2: "👭 Conoce gente nueva y haz amigos con tu misma afición",
    reason3: "🍺 Tapas y bebidas en un espacio único en Barcelona",
    reason4: "🗣 Practica idiomas mientras te diviertes",
    reason5: "🏆 Torneos, slow dating lúdico y eventos especiales todo el año",
    statsTitle: "KLEFF en números",
    statAttendees: "Asistentes por Game Night",
    statGames: "Juegos de mesa disponibles",
    statHours: "Horas de juego cada semana",
    statGrowth: "Crecimiento anual",
    statMembers: "Kleffers en Meetup",
    statUpcoming: "Próximos eventos",
    statRating: "Valoración media",
    joinTitle: "¿Listo para tu primera partida?",
    joinSubtitle: "Únete a nuestra comunidad y reserva tu sitio en el próximo evento.",
    testimonialsEyebrow: "Lo que dicen los kleffers",
    testimonialsTitle: "Más de 2.700 valoraciones lo avalan",
    testimonialsSubtitle: "4,8 ★ en Meetup · 5,0 ★ en Google. Estas son algunas voces de la comunidad.",
    testimonialsMeetup: "Ver todas en Meetup",
    testimonialsGoogle: "Ver en Google Maps",
  },
  footer: {
    tagline: "Conectamos personas a través de los juegos de mesa.",
    sections: "Secciones",
    follow: "Síguenos",
    contact: "Contacto",
    rights: "Todos los derechos reservados.",
    location: "L'Estació Espai Gastronòmic · Av. Marquès de l'Argentera 6-8, Barcelona",
  },
  about: {
    eyebrow: "Quiénes somos",
    title: "Una comunidad nacida del amor por los juegos de mesa",
    intro:
      "KLEFF nace a finales de 2019 con la intención de crear el primer afterwork lúdico de Barcelona. Hoy somos la comunidad de juegos de mesa más grande de Europa.",
    storyTitle: "Nuestra historia",
    storyP1:
      "Empezamos como un encuentro entre amigos para jugar después del trabajo. Lo que era una mesa con cuatro juegos se convirtió rápidamente en un movimiento: bares llenos, salas privadas y una ludoteca que no para de crecer.",
    storyP2:
      "Hoy nuestra sede es L'Estació Espai Gastronòmic, en la Estació de França. Un espacio singular, con historia y aforo para 300 personas, donde cada semana ocurre algo distinto.",
    valuesTitle: "Lo que nos mueve",
    value1Title: "Inclusión",
    value1Body:
      "Cualquier persona, sin importar origen, edad o nivel. Si vienes solo, te sentamos en una mesa.",
    value2Title: "Cultura y lengua",
    value2Body:
      "Promovemos el catalán, el castellano y el inglés. Las partidas son un espacio natural para practicar idiomas.",
    value3Title: "Diversión sin postureo",
    value3Body:
      "No hay nivel mínimo, no hay juicio. Sólo ganas de pasarlo bien y conocer gente nueva.",
    activitiesTitle: "Qué hacemos",
    weekly: "Cada semana",
    monthly: "Cada mes",
    yearly: "Una vez al año",
    occasional: "De vez en cuando",
    teamTitle: "El equipo",
    teamSubtitle: "Las personas detrás de cada Game Night.",
    communitiesTitle: "Nuestras comunidades",
    partnersTitle: "Colaboradores habituales",
    partnersAssociations: "Asociaciones y entidades",
    partnersShops: "Tiendas",
    partnersPublishers: "Editoriales",
    pressTitle: "Han hablado de nosotros",
  },
  contact: {
    eyebrow: "Contacto",
    title: "Hablemos",
    subtitle:
      "¿Quieres colaborar, organizar un evento privado o simplemente saludar? Estamos al otro lado.",
    nameLabel: "Tu nombre",
    emailLabel: "Tu correo",
    messageLabel: "Cuéntanos",
    submit: "Enviar mensaje",
    success: "¡Gracias! Te responderemos pronto.",
    or: "o escríbenos a",
    findUs: "Dónde estamos",
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "Así funciona KLEFF",
    intro:
      "Somos una asociación sin ánimo de lucro. Las actividades recurrentes son gratuitas, pero el espacio que nos cede l'Estació Espai Gastronòmic pide una consumición mínima de 4€ al iniciar la actividad. Así apoyamos al local que nos abre las puertas cada semana.",
    nonProfitTitle: "Asociación sin ánimo de lucro",
    nonProfitBody:
      "KLEFF se constituye formalmente como asociación sin finalidad de lucro. Todo lo que generamos vuelve a la comunidad: ludoteca, eventos especiales y colaboraciones.",
    consumptionBadge: "4€ de consumición · gratis la actividad",
    howItWorksTitle: "Vienes solo, en pareja o con amigos. Da igual.",
    howItWorksBody:
      "No necesitas reservar mesa ni traer a nadie. El #TeamKLEFF (camiseta roja) te recibe, te ayuda a encontrar mesa donde empezar una partida o te empareja con otra gente con ganas de jugar. En 10 minutos estás riéndote con desconocidos.",
    step1Title: "Llegas",
    step1Body:
      "Entras en l'Estació Espai Gastronòmic. Pides una bebida o algo de picar (esa es la consumición de 4€). Te apuntas en Meetup si todavía no lo has hecho.",
    step2Title: "Encuentras mesa",
    step2Body:
      "El #TeamKLEFF (camiseta roja) está para ayudarte. Te emparejan con gente buscando mesa, te recomiendan un juego según tus ganas y te lo explican si no lo conoces.",
    step3Title: "Juegas y vuelves",
    step3Body:
      "Más de 300 juegos disponibles. Cuando termines una partida, prueba otra mesa o quédate en la tuya. La noche dura 4 horas y nadie tiene prisa.",
    activitiesTitle: "Qué puedes encontrar",
    activitiesSubtitle:
      "Desde la noche de juegos semanal hasta torneos, citas lúdicas y eventos solidarios.",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
    occasional: "Puntual",
    activityWeekly1Title: "Noche de Juegos",
    activityWeekly1Body:
      "Evento regular con ludoteca abierta y partidas programadas de Blood on the Clocktower, Catan y otros muchos.",
    activityOccasional1Title: "Slow Dating Lúdico",
    activityOccasional1Body:
      "Concepto similar al speed dating, pero con juegos sociales como excusa para conectar a personas.",
    activityMonthly1Title: "Torneos",
    activityMonthly1Body:
      "Actividad competitiva de los juegos más populares de la comunidad.",
    activityMonthly2Title: "Demostraciones de editoriales y autores",
    activityMonthly2Body:
      "Jornadas para aprender juegos nuevos directamente con quienes los han creado y publicado.",
    activityYearly1Title: "Game Night: Carnival",
    activityYearly1Body:
      "Noche de juegos especial con concurso de disfraces de carnaval.",
    activityYearly2Title: "Game Night: Halloween",
    activityYearly2Body:
      "Noche de juegos especial con concurso de disfraces de temática Halloween.",
    activityYearly3Title: "X-Mas Game Night",
    activityYearly3Body:
      "Evento solidario para recaudar fondos para el Hospital Sant Joan de Déu, especializado en cáncer infantil.",
    communitiesEyebrow: "Comunidades",
    communitiesTitle: "¿Quieres formar parte de una comunidad específica?",
    communitiesIntro:
      "Dentro de KLEFF conviven varias comunidades alrededor de juegos concretos. Cada una tiene su grupo, sus partidas regulares y sus eventos. Únete a la que más te guste.",
    community1Title: "Blood on the Clocktower",
    community1Body:
      "Comunidad del juego de roles ocultos mejor valorado en el ranking de la BGG. Programamos como mínimo 2 partidas semanales.",
    community1Tag: "2 partidas/semana",
    community2Title: "Catan",
    community2Body:
      "Comunidad del precursor de los juegos de mesa modernos. Organizamos torneos y actividades de forma recurrente.",
    community2Tag: "Torneos recurrentes",
    community3Title: "Unmatched",
    community3Body:
      "Comunidad del juego de mesa de enfrentamientos más popular del momento. Organizamos torneos de forma frecuente.",
    community3Tag: "Torneos frecuentes",
    community4Title: "Roles Ocultos",
    community4Body:
      "Comunidad para descubrir y disfrutar de juegos de deducción social e identidades secretas.",
    community4Tag: "Deducción social",
    memberEyebrow: "Hazte socio",
    memberTitle: "Sé parte real del proyecto",
    memberSubtitle:
      "Ser socio de KLEFF no es solo apoyar la asociación: es desbloquear ventajas pensadas para quien viene de verdad.",
    memberFlipHint: "Pasa el ratón sobre cada ventaja",
    benefit1Title: "Alquiler de juegos",
    benefit1Body:
      "Llévate juegos de nuestra ludoteca de más de 300 títulos a casa por un fin de semana o entre semana.",
    benefit2Title: "Acceso prioritario",
    benefit2Body:
      "Reserva primero plaza en eventos especiales, torneos con aforo limitado y noches temáticas.",
    benefit3Title: "Descuentos en tiendas",
    benefit3Body:
      "Descuentos en tiendas colaboradoras de Barcelona como Mathom, The Curiosity Shop, Gameria o Kaburi.",
    benefit4Title: "Comunidad real",
    benefit4Body:
      "Acceso a un canal exclusivo de socios, propuestas de mejora y voto en las actividades anuales.",
    memberCtaTitle: "¿Listo para hacerte socio?",
    memberCtaBody:
      "Estamos terminando de definir la cuota anual y los pasos para apuntarse. Déjanos tu correo y te avisamos en cuanto abramos las inscripciones.",
    memberCta: "Quiero más info",
  },
  media: {
    eyebrow: "Media",
    title: "Han hablado de nosotros",
    intro:
      "Reportajes, podcasts, artículos y reels que han contado la historia de KLEFF. Ordenados de más reciente a más antiguo.",
    pressTitle: "Apariciones en prensa",
    pressSubtitle: "Selección de los medios donde hemos salido los últimos años.",
    visitArticle: "Ver publicación",
    instagramTitle: "Síguenos en Instagram",
    instagramSubtitle:
      "Las mejores fotos de cada Game Night, los próximos eventos y los momentos más divertidos están en @kleff.bcn.",
    instagramCta: "Abrir @kleff.bcn",
    loading: "Cargando vista previa…",
    noPreview: "Vista previa no disponible — abre el enlace para verlo.",
  },
};

const en: Dict = {
  nav: {
    home: "Home",
    about: "About",
    blog: "Blog",
    contact: "Contact",
    join: "Join us",
  },
  home: {
    eyebrow: "Europe's largest board game community",
    titleA: "Board games,",
    titleHighlight: "good vibes",
    titleB: "and Barcelona.",
    subtitle:
      "Every week we meet at l'Estació de França to laugh, meet people and discover more than 300 board games. No experience needed — we'll teach you.",
    ctaPrimary: "Join the next Game Night",
    ctaSecondary: "Get to know us",
    pillarsTitle: "Why KLEFF exists",
    pillarsSubtitle: "Three pillars holding up everything we do.",
    pillar1Title: "Community",
    pillar1Body:
      "Over 10,000 people sharing the same passion. Come alone, as a couple or with friends — you'll find your table.",
    pillar2Title: "Central location",
    pillar2Body:
      "L'Estació Espai Gastronòmic, right inside Estació de França. Tapas, drinks and room for 300.",
    pillar3Title: "Great atmosphere",
    pillar3Body:
      "Inclusive, multilingual (ES · CAT · EN) and open to all levels. What matters here is having fun.",
    eventsTitle: "Upcoming events",
    eventsSubtitle: "What's coming up in the next few weeks.",
    eventsCta: "See all on Meetup",
    eventsEmpty: "We're planning the next events. Follow us on Meetup so you don't miss a thing.",
    eventJoin: "RSVP",
    reasonsEyebrow: "Game Night",
    reasonsTitle: "5 reasons to join a Game Night",
    reason1: "🎲 Enjoy a huge variety of games (we explain how to play all of them!)",
    reason2: "👭 Meet new people and make friends with the same hobby",
    reason3: "🍺 Tapas and drinks in a unique Barcelona venue",
    reason4: "🗣 Practice languages while having fun",
    reason5: "🏆 Tournaments, slow dating and special events all year long",
    statsTitle: "KLEFF in numbers",
    statAttendees: "Attendees per Game Night",
    statGames: "Board games available",
    statHours: "Hours of play every week",
    statGrowth: "Annual growth",
    statMembers: "Kleffers on Meetup",
    statUpcoming: "Upcoming events",
    statRating: "Average rating",
    joinTitle: "Ready for your first game?",
    joinSubtitle: "Join our community and grab your spot at the next event.",
    testimonialsEyebrow: "What kleffers say",
    testimonialsTitle: "Backed by 2,700+ ratings",
    testimonialsSubtitle: "4.8 ★ on Meetup · 5.0 ★ on Google. A few voices from the community.",
    testimonialsMeetup: "Read all on Meetup",
    testimonialsGoogle: "See on Google Maps",
  },
  footer: {
    tagline: "Connecting people through board games.",
    sections: "Sections",
    follow: "Follow us",
    contact: "Contact",
    rights: "All rights reserved.",
    location: "L'Estació Espai Gastronòmic · Av. Marquès de l'Argentera 6-8, Barcelona",
  },
  about: {
    eyebrow: "About us",
    title: "A community born from a love of board games",
    intro:
      "KLEFF was born in late 2019 with the goal of creating Barcelona's first board-game afterwork. Today we're Europe's largest board game community.",
    storyTitle: "Our story",
    storyP1:
      "We started as a small group of friends meeting up after work to play. What began as one table with four games quickly became a movement: packed bars, private rooms and a constantly growing collection.",
    storyP2:
      "Today our home base is L'Estació Espai Gastronòmic, in Estació de França. A unique venue, full of history, with room for 300 people — and something different happening every week.",
    valuesTitle: "What drives us",
    value1Title: "Inclusion",
    value1Body:
      "Anyone, regardless of background, age or level. Coming alone? We'll seat you at a table.",
    value2Title: "Culture and language",
    value2Body:
      "We promote Catalan, Spanish and English. Game nights are a natural place to practice languages.",
    value3Title: "Fun without pretension",
    value3Body:
      "No minimum level, no judgment. Just a desire to have a good time and meet people.",
    activitiesTitle: "What we do",
    weekly: "Every week",
    monthly: "Every month",
    yearly: "Once a year",
    occasional: "From time to time",
    teamTitle: "The team",
    teamSubtitle: "The people behind every Game Night.",
    communitiesTitle: "Our communities",
    partnersTitle: "Regular partners",
    partnersAssociations: "Associations & organizations",
    partnersShops: "Shops",
    partnersPublishers: "Publishers",
    pressTitle: "As featured in",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk",
    subtitle:
      "Want to collaborate, organize a private event or just say hi? We're on the other side.",
    nameLabel: "Your name",
    emailLabel: "Your email",
    messageLabel: "Tell us",
    submit: "Send message",
    success: "Thanks! We'll get back to you soon.",
    or: "or email us at",
    findUs: "Where to find us",
  },
};

const ca: Dict = {
  nav: {
    home: "Inici",
    about: "Qui som",
    blog: "Blog",
    contact: "Contacte",
    join: "Uneix-te",
  },
  home: {
    eyebrow: "La comunitat de jocs de taula més gran d'Europa",
    titleA: "Jocs de taula,",
    titleHighlight: "bon rotllo",
    titleB: "i Barcelona.",
    subtitle:
      "Cada setmana ens trobem a l'Estació de França per riure, conèixer gent i descobrir més de 300 jocs de taula. No cal saber jugar — t'ho expliquem.",
    ctaPrimary: "Apunta't a la propera Game Night",
    ctaSecondary: "Coneix-nos",
    pillarsTitle: "Per què neix KLEFF",
    pillarsSubtitle: "Tres pilars que sostenen tot el que fem.",
    pillar1Title: "Comunitat",
    pillar1Body:
      "Més de 10.000 persones que comparteixen una afició. Vinguis sol, en parella o amb amics, hi trobaràs la teva taula.",
    pillar2Title: "Ubicació cèntrica",
    pillar2Body:
      "L'Estació Espai Gastronòmic, al cor de l'Estació de França. Amb tapes, begudes i aforament per a 300 persones.",
    pillar3Title: "Bon ambient",
    pillar3Body:
      "Inclusiu, multilingüe (ES · CAT · EN) i obert a qualsevol nivell. Aquí l'important és passar-ho bé.",
    eventsTitle: "Pròxims esdeveniments",
    eventsSubtitle: "El que tenim preparat per a les pròximes setmanes.",
    eventsCta: "Veure'ls tots a Meetup",
    eventsEmpty: "Estem preparant els pròxims esdeveniments. Segueix-nos a Meetup per no perdre't res.",
    eventJoin: "Apuntar-m'hi",
    reasonsEyebrow: "Game Night",
    reasonsTitle: "5 raons per venir a una Game Night",
    reason1: "🎲 Gaudeix d'una enorme varietat de jocs (us ensenyem a jugar-hi a tots!)",
    reason2: "👭 Coneix gent nova i fes amics amb la mateixa afició",
    reason3: "🍺 Tapes i begudes en un espai únic de Barcelona",
    reason4: "🗣 Practica idiomes mentre et diverteixes",
    reason5: "🏆 Tornejos, slow dating lúdic i esdeveniments especials tot l'any",
    statsTitle: "KLEFF en xifres",
    statAttendees: "Assistents per Game Night",
    statGames: "Jocs de taula disponibles",
    statHours: "Hores de joc cada setmana",
    statGrowth: "Creixement anual",
    statMembers: "Kleffers a Meetup",
    statUpcoming: "Pròxims esdeveniments",
    statRating: "Valoració mitjana",
    joinTitle: "A punt per a la teva primera partida?",
    joinSubtitle: "Uneix-te a la nostra comunitat i reserva el teu lloc al pròxim esdeveniment.",
    testimonialsEyebrow: "El que diuen els kleffers",
    testimonialsTitle: "Més de 2.700 valoracions ho avalen",
    testimonialsSubtitle: "4,8 ★ a Meetup · 5,0 ★ a Google. Aquestes són algunes veus de la comunitat.",
    testimonialsMeetup: "Veure-les totes a Meetup",
    testimonialsGoogle: "Veure a Google Maps",
  },
  footer: {
    tagline: "Connectem persones a través dels jocs de taula.",
    sections: "Seccions",
    follow: "Segueix-nos",
    contact: "Contacte",
    rights: "Tots els drets reservats.",
    location: "L'Estació Espai Gastronòmic · Av. Marquès de l'Argentera 6-8, Barcelona",
  },
  about: {
    eyebrow: "Qui som",
    title: "Una comunitat nascuda de l'amor pels jocs de taula",
    intro:
      "KLEFF neix a finals de 2019 amb la intenció de crear el primer afterwork lúdic de Barcelona. Avui som la comunitat de jocs de taula més gran d'Europa.",
    storyTitle: "La nostra història",
    storyP1:
      "Vam començar com una trobada entre amics per jugar després de la feina. El que era una taula amb quatre jocs es va convertir ràpidament en un moviment: bars plens, sales privades i una ludoteca que no para de créixer.",
    storyP2:
      "Avui la nostra seu és L'Estació Espai Gastronòmic, a l'Estació de França. Un espai singular, amb història i aforament per a 300 persones, on cada setmana hi passa alguna cosa diferent.",
    valuesTitle: "El que ens mou",
    value1Title: "Inclusió",
    value1Body:
      "Qualsevol persona, sense importar origen, edat o nivell. Si vens sol, et seiem en una taula.",
    value2Title: "Cultura i llengua",
    value2Body:
      "Promovem el català, el castellà i l'anglès. Les partides són un espai natural per practicar idiomes.",
    value3Title: "Diversió sense pretensions",
    value3Body:
      "Sense nivell mínim, sense judici. Només ganes de passar-ho bé i conèixer gent nova.",
    activitiesTitle: "Què fem",
    weekly: "Cada setmana",
    monthly: "Cada mes",
    yearly: "Un cop l'any",
    occasional: "De tant en tant",
    teamTitle: "L'equip",
    teamSubtitle: "Les persones darrere de cada Game Night.",
    communitiesTitle: "Les nostres comunitats",
    partnersTitle: "Col·laboradors habituals",
    partnersAssociations: "Associacions i entitats",
    partnersShops: "Botigues",
    partnersPublishers: "Editorials",
    pressTitle: "N'han parlat",
  },
  contact: {
    eyebrow: "Contacte",
    title: "Parlem",
    subtitle:
      "Vols col·laborar, organitzar un esdeveniment privat o simplement saludar? Som a l'altre costat.",
    nameLabel: "El teu nom",
    emailLabel: "El teu correu",
    messageLabel: "Explica'ns",
    submit: "Envia el missatge",
    success: "Gràcies! Et respondrem aviat.",
    or: "o escriu-nos a",
    findUs: "On som",
  },
};

export const dictionaries: Record<Locale, Dict> = { es, en, ca };
export type { Dict };
