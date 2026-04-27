import type { Locale } from "./config";

type Dict = {
  nav: {
    home: string;
    about: string;
    blog: string;
    contact: string;
    join: string;
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
    joinTitle: "¿Listo para tu primera partida?",
    joinSubtitle: "Únete a nuestra comunidad y reserva tu sitio en el próximo evento.",
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
    joinTitle: "Ready for your first game?",
    joinSubtitle: "Join our community and grab your spot at the next event.",
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
    joinTitle: "A punt per a la teva primera partida?",
    joinSubtitle: "Uneix-te a la nostra comunitat i reserva el teu lloc al pròxim esdeveniment.",
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
