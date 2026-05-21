import type { Locale } from "./config";

type Dict = {
  nav: {
    home: string;
    about: string;
    how: string;
    activities: string;
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
    legalNotice: string;
    privacy: string;
    cookies: string;
    terms: string;
    cookieSettings: string;
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
  activities: {
    eyebrow: string;
    title: string;
    intro: string;
    ctaMeetup: string;
    ctaHow: string;
    mainEyebrow: string;
    mainTitle: string;
    mainBody1: string;
    mainBody2: string;
    mainCta: string;
    insideTitle: string;
    insideSubtitle: string;
    inside1Title: string;
    inside1Body: string;
    inside2Title: string;
    inside2Body: string;
    inside3Title: string;
    inside3Body: string;
    specialEyebrow: string;
    specialTitle: string;
    specialSubtitle: string;
    special1Title: string;
    special1Body: string;
    special2Title: string;
    special2Body: string;
    special3Title: string;
    special3Body: string;
    specialNote: string;
    frequentEyebrow: string;
    frequentTitle: string;
    frequentBody: string;
    frequentExampleTitle: string;
    frequentExampleBody: string;
    partnersEyebrow: string;
    partnersTitle: string;
    partnersBody: string;
    teamBuildingEyebrow: string;
    teamBuildingTitle: string;
    teamBuildingBody: string;
    teamBuildingCta: string;
    calendarEyebrow: string;
    calendarTitle: string;
    calendarBody: string;
    calendarCta: string;
    calendarGroup: string;
    badgeWeekly: string;
    badgeMonthly: string;
    badgeYearly: string;
    badgeOccasional: string;
    badgeFrequent: string;
    badgeCustom: string;
    learnMoreEvents: string;
  };
};

const es: Dict = {
  nav: {
    home: "Inicio",
    about: "Quiénes somos",
    how: "Cómo funciona",
    activities: "Actividades",
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
    reason5: "🏆 Torneos, slow friending lúdico y eventos especiales todo el año",
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
    legalNotice: "Aviso Legal",
    privacy: "Privacidad",
    cookies: "Cookies",
    terms: "Términos",
    cookieSettings: "Preferencias de cookies",
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
      "No necesitas reservar mesa ni traer a nadie. Si vienes solo, te emparejan con gente buscando mesa, te recomiendan un juego según tus ganas y te lo explican si no lo conoces. En 10 minutos estás riéndote con desconocidos.",
    step1Title: "Llegas",
    step1Body:
      "Entras en l'Estació Espai Gastronòmic. Pides una bebida (esa es la consumición de 4€) o algo de picar. Un miembro del #TeamKLEFF te recibe en la recepción.",
    step2Title: "Encuentras mesa",
    step2Body:
      "Si vienes sin compañía, te emparejamos con gente buscando mesa, recomendamos un juego según tus preferencias y te lo explicamos si no lo conoces.",
    step3Title: "Juegas y vuelves",
    step3Body:
      "Más de 500 juegos disponibles. Cuando termines una partida, prueba otra mesa o quédate en la tuya. La noche dura 4 horas y nadie tiene prisa.",
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
    activityOccasional1Title: "Slow Friending Lúdico",
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
    community3Title: "Torneos",
    community3Body:
      "Comunidad con torneos de diferentes juegos casi cada semana: Unmatched, Catan, Magic, party games y mucho más.",
    community3Tag: "Torneos casi cada semana",
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
  activities: {
    eyebrow: "Actividades",
    title: "Esto es KLEFF",
    intro:
      "Nuestra actividad principal es la Noche de Juegos, cada miércoles. Dentro suceden el resto de cosas: torneos, demostraciones, Slow Friending Lúdico y ediciones especiales temáticas. Aquí te lo contamos todo.",
    ctaMeetup: "Ver próximos eventos",
    ctaHow: "Cómo funciona",
    mainEyebrow: "Cada miércoles",
    mainTitle: "La Noche de Juegos",
    mainBody1:
      "La Noche de Juegos es tu punto de partida para formar parte de la comunidad KLEFF. Un afterwork lúdico cada miércoles donde puedes venir con amigos, compañeros de trabajo o tú solo para hacer nuevas amistades — siempre hay sitio en alguna mesa.",
    mainBody2:
      "Es el punto de encuentro semanal para socializar, romper con la rutina y descubrir que jugar entre adultos es la mejor excusa para conectar de verdad. Sin presión, sin agenda — solo gente con ganas de pasarlo bien.",
    mainCta: "Apúntate a la próxima Noche de Juegos",
    insideTitle: "Qué pasa dentro de la Noche de Juegos",
    insideSubtitle:
      "Además del juego libre con la ludoteca abierta, cada noche puede pasar algo distinto.",
    inside1Title: "Torneos",
    inside1Body:
      "Una vez al mes (a veces más) organizamos torneos competitivos de los juegos más populares de la comunidad: Catan, Unmatched, Magic, Hidden Roles, party games… Apuntarse es gratis y hay premios para los ganadores. Ideal si te gusta la chispa de la competición sin renunciar al buen ambiente.",
    inside2Title: "Demostraciones de editoriales y autores",
    inside2Body:
      "Periódicamente invitamos a editoriales y autores a presentar sus juegos directamente en nuestras mesas. Aprendes el juego de la mano de quien lo ha creado, descubres novedades antes de que lleguen a las tiendas y puedes resolver dudas en vivo. Una forma única de ver cómo se piensa un juego desde dentro.",
    inside3Title: "Slow Friending Lúdico",
    inside3Body:
      "Nuestra versión del speed dating, pero con juegos sociales como excusa para conectar. Mesas rotativas, dinámicas pensadas para romper el hielo y conocer gente nueva sin la presión incómoda de las citas tradicionales. Pensado para hacer amistades reales (o lo que surja).",
    specialEyebrow: "Game Nights especiales",
    specialTitle: "Ediciones únicas, una vez al año",
    specialSubtitle:
      "Son Noches de Juegos especiales con temática propia. Solo pasan una vez al año, así que vale la pena marcarlas en el calendario.",
    special1Title: "Game Night: Carnival",
    special1Body:
      "Noche de juegos con concurso de disfraces de carnaval. La sala se llena de purpurina, máscaras y mucha gente jugando con vestuario imposible. Premios para los mejores disfraces.",
    special2Title: "Game Night: Halloween",
    special2Body:
      "Edición de terror y misterio. Disfraces obligatorios (o casi), juegos temáticos de deducción social y un ambiente que solo pasa una vez al año. La favorita de muchos kleffers.",
    special3Title: "X-Mas Game Night",
    special3Body:
      "Evento solidario de cierre de año. Recaudamos fondos para el Hospital Sant Joan de Déu, especializado en oncología infantil. Juegos, sorteos y la satisfacción de ayudar a una buena causa.",
    specialNote:
      "Son ediciones especiales de la Noche de Juegos: mismo formato, mismo local, mismo equipo — solo que con un toque extra.",
    frequentEyebrow: "Colaboraciones",
    frequentTitle: "Eventos con espacios y entidades aliadas",
    frequentBody:
      "De vez en cuando salimos del local habitual para organizar eventos especiales en colaboración con otros espacios de Barcelona — combinando juegos con gastronomía, talleres o experiencias temáticas. Un ejemplo reciente es nuestra tarde de juegos con cocina japonesa en Casa Hanaka.",
    frequentExampleTitle: "",
    frequentExampleBody: "",
    partnersEyebrow: "",
    partnersTitle: "",
    partnersBody:
      "Además, colaboramos con otras asociaciones y colectivos que organizan partidas y actividades otros días de la semana. Así, si te pierdes el miércoles, casi siempre hay un plan lúdico cerca.",
    teamBuildingEyebrow: "A medida",
    teamBuildingTitle: "¿Quieres un evento privado o team building?",
    teamBuildingBody:
      "Organizamos eventos a medida para empresas, equipos, despedidas, cumpleaños o cualquier grupo que quiera vivir una experiencia lúdica única. Diseñamos la dinámica, traemos los juegos y nos encargamos de que todo el mundo se lo pase bien — incluso quien dice que «no le gustan los juegos de mesa».",
    teamBuildingCta: "Contáctanos",
    calendarEyebrow: "Calendario",
    calendarTitle: "¿Quieres saber más sobre los eventos?",
    calendarBody:
      "Todos los eventos, fechas, descripciones y RSVP están en nuestro Meetup. Es gratis apuntarse y la mejor forma de no perderte nada.",
    calendarCta: "Ver calendario completo en Meetup",
    calendarGroup: "O explora todo el grupo de KLEFF",
    badgeWeekly: "Semanal",
    badgeMonthly: "Mensual",
    badgeYearly: "Anual",
    badgeOccasional: "Puntual",
    badgeFrequent: "Recurrente",
    badgeCustom: "A medida",
    learnMoreEvents: "¿Quieres saber más sobre los eventos? Descubre todas las actividades",
  },
};

const en: Dict = {
  nav: {
    home: "Home",
    about: "About",
    how: "How it works",
    activities: "Activities",
    media: "Media",
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
    reason5: "🏆 Tournaments, slow friending and special events all year long",
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
    legalNotice: "Legal Notice",
    privacy: "Privacy",
    cookies: "Cookies",
    terms: "Terms",
    cookieSettings: "Cookie preferences",
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
  how: {
    eyebrow: "How it works",
    title: "How KLEFF works",
    intro:
      "We're a non-profit association. Our recurring activities are free, but the venue that hosts us — l'Estació Espai Gastronòmic — asks for a small minimum order of €4 when the activity starts. That's how we support the place that opens its doors to us every week.",
    nonProfitTitle: "Non-profit association",
    nonProfitBody:
      "KLEFF is formally constituted as a non-profit association. Everything we generate goes back to the community: game library, special events and collaborations.",
    consumptionBadge: "€4 minimum order · activity is free",
    howItWorksTitle: "Come alone, as a couple or with friends. Doesn't matter.",
    howItWorksBody:
      "No need to book a table or bring anyone. The #TeamKLEFF (red shirts) welcomes you, helps you find a table to start a game or pairs you with other people who want to play. Within 10 minutes you're laughing with strangers.",
    step1Title: "You arrive",
    step1Body:
      "Walk into l'Estació Espai Gastronòmic. Order a drink (€4 minimum order) or something to snack on. A member of #TeamKLEFF welcomes you at the reception.",
    step2Title: "You find a table",
    step2Body:
      "The #TeamKLEFF (red shirts) is here to help. They pair you with people looking for a table, recommend a game based on your mood and explain the rules if you don't know it.",
    step3Title: "You play and come back",
    step3Body:
      "Over 500 games available. Once you finish a round, try another table or stay at yours. The night runs for 4 hours and nobody's in a rush.",
    activitiesTitle: "What you'll find",
    activitiesSubtitle:
      "From the weekly game night to tournaments, social-game dating and charity events.",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    occasional: "Occasional",
    activityWeekly1Title: "Game Night",
    activityWeekly1Body:
      "Regular event with open game library and scheduled rounds of Blood on the Clocktower, Catan and many more.",
    activityOccasional1Title: "Slow Friending Dating",
    activityOccasional1Body:
      "Similar concept to speed dating but using social games as the excuse to connect people.",
    activityMonthly1Title: "Tournaments",
    activityMonthly1Body:
      "Competitive events for the most popular games in the community.",
    activityMonthly2Title: "Publisher & author demos",
    activityMonthly2Body:
      "Sessions to learn new games directly from the people who designed and published them.",
    activityYearly1Title: "Game Night: Carnival",
    activityYearly1Body:
      "Special game night with a carnival costume contest.",
    activityYearly2Title: "Game Night: Halloween",
    activityYearly2Body:
      "Special game night with a Halloween-themed costume contest.",
    activityYearly3Title: "X-Mas Game Night",
    activityYearly3Body:
      "Charity event raising funds for Hospital Sant Joan de Déu, specialised in childhood cancer.",
    communitiesEyebrow: "Communities",
    communitiesTitle: "Want to be part of a specific community?",
    communitiesIntro:
      "Inside KLEFF there are several communities built around specific games. Each one has its own group, regular sessions and events. Join the one you love most.",
    community1Title: "Blood on the Clocktower",
    community1Body:
      "Community of the highest-rated hidden role game on the BGG ranking. We schedule at least 2 sessions per week.",
    community1Tag: "2 sessions/week",
    community2Title: "Catan",
    community2Body:
      "Community of the modern board game pioneer. We organise tournaments and activities on a recurring basis.",
    community2Tag: "Recurring tournaments",
    community3Title: "Tournaments",
    community3Body:
      "A community with tournaments across different games almost every week: Unmatched, Catan, Magic, party games and more.",
    community3Tag: "Tournaments almost weekly",
    community4Title: "Hidden Roles",
    community4Body:
      "Community to discover and enjoy social deduction and hidden identity games.",
    community4Tag: "Social deduction",
    memberEyebrow: "Become a member",
    memberTitle: "Be a real part of the project",
    memberSubtitle:
      "Becoming a KLEFF member is more than supporting the association: it unlocks perks designed for those who really show up.",
    memberFlipHint: "Hover each benefit",
    benefit1Title: "Borrow games",
    benefit1Body:
      "Take games from our 300+ title library home for a weekend or weekday.",
    benefit2Title: "Priority access",
    benefit2Body:
      "Get first dibs on special events, capacity-limited tournaments and themed nights.",
    benefit3Title: "Shop discounts",
    benefit3Body:
      "Discounts at partner shops in Barcelona like Mathom, The Curiosity Shop, Gameria or Kaburi.",
    benefit4Title: "Real community",
    benefit4Body:
      "Access to a members-only channel, suggestions space and voting on yearly activities.",
    memberCtaTitle: "Ready to become a member?",
    memberCtaBody:
      "We're finalising the annual fee and the steps to sign up. Drop us your email and we'll let you know as soon as memberships open.",
    memberCta: "I want more info",
  },
  media: {
    eyebrow: "Media",
    title: "They've talked about us",
    intro:
      "Reports, podcasts, articles and reels that have told the KLEFF story. Sorted from most recent to oldest.",
    pressTitle: "Press appearances",
    pressSubtitle: "A selection of the outlets that have featured us.",
    visitArticle: "Open article",
    instagramTitle: "Follow us on Instagram",
    instagramSubtitle:
      "The best photos from every Game Night, upcoming events and our funniest moments live at @kleff.bcn.",
    instagramCta: "Open @kleff.bcn",
    loading: "Loading preview…",
    noPreview: "Preview not available — open the link to see it.",
  },
  activities: {
    eyebrow: "Activities",
    title: "This is KLEFF",
    intro:
      "Our main activity is Game Night, every Wednesday. Everything else happens inside it: tournaments, publisher demos, Slow Friending and themed special editions. Here's the full picture.",
    ctaMeetup: "See upcoming events",
    ctaHow: "How it works",
    mainEyebrow: "Every Wednesday",
    mainTitle: "Game Night",
    mainBody1:
      "Game Night is your starting point to become part of the KLEFF community. A playful afterwork every Wednesday where you can come with friends, workmates or solo to make new friendships — there's always a seat at some table.",
    mainBody2:
      "It's the weekly meeting point to socialise, break the routine and discover that playing together is the best excuse to truly connect. No pressure, no agenda — just people up for a great time.",
    mainCta: "Join the next Game Night",
    insideTitle: "What happens inside Game Night",
    insideSubtitle:
      "Beyond free play with the open library, every night something different can happen.",
    inside1Title: "Tournaments",
    inside1Body:
      "Once a month (sometimes more) we run competitive tournaments of the community's favourite games: Catan, Unmatched, Magic, Hidden Roles, party games… Free to join, with prizes for the winners. Perfect if you love the competitive spark without losing the friendly vibe.",
    inside2Title: "Publisher & author demos",
    inside2Body:
      "We regularly invite publishers and authors to present their games directly at our tables. You learn the game from the people who created it, discover novelties before they hit the shops and can ask anything live. A unique way to peek behind the curtain of game design.",
    inside3Title: "Slow Friending",
    inside3Body:
      "Our take on speed dating, but using social games as the excuse to connect. Rotating tables, dynamics designed to break the ice and meet new people without the awkward pressure of traditional dating. Made for real friendships (or whatever happens).",
    specialEyebrow: "Special Game Nights",
    specialTitle: "Unique editions, once a year",
    specialSubtitle:
      "These are themed Game Nights that only happen once a year, so they're worth marking on the calendar.",
    special1Title: "Game Night: Carnival",
    special1Body:
      "Game night with a carnival costume contest. The room fills with glitter, masks and people playing in impossible outfits. Prizes for the best costumes.",
    special2Title: "Game Night: Halloween",
    special2Body:
      "Horror and mystery edition. Costumes expected (or almost), themed social deduction games and an atmosphere that only happens once a year. A community favourite.",
    special3Title: "X-Mas Game Night",
    special3Body:
      "Charity end-of-year event. We raise funds for Hospital Sant Joan de Déu, specialised in childhood oncology. Games, raffles and the satisfaction of helping a great cause.",
    specialNote:
      "These are special editions of Game Night: same format, same venue, same team — just with an extra twist.",
    frequentEyebrow: "Collaborations",
    frequentTitle: "Events with allied spaces and groups",
    frequentBody:
      "From time to time we leave our usual venue to organise special events with other Barcelona spaces — mixing games with food, workshops or themed experiences. A recent example is our games & Japanese food afternoon at Casa Hanaka.",
    frequentExampleTitle: "",
    frequentExampleBody: "",
    partnersEyebrow: "",
    partnersTitle: "",
    partnersBody:
      "We also partner with other associations and collectives running games and activities on other days of the week. So if you miss Wednesday, there's almost always a board-game plan nearby.",
    teamBuildingEyebrow: "Bespoke",
    teamBuildingTitle: "Looking for a private event or team building?",
    teamBuildingBody:
      "We design bespoke events for companies, teams, stag/hen parties, birthdays or any group wanting a unique playful experience. We design the dynamic, bring the games and make sure everyone has fun — even the «I don't like board games» people.",
    teamBuildingCta: "Contact us",
    calendarEyebrow: "Calendar",
    calendarTitle: "Want to know more about the events?",
    calendarBody:
      "All events, dates, descriptions and RSVPs live on our Meetup. Joining is free and it's the best way not to miss anything.",
    calendarCta: "See the full calendar on Meetup",
    calendarGroup: "Or explore the whole KLEFF group",
    badgeWeekly: "Weekly",
    badgeMonthly: "Monthly",
    badgeYearly: "Yearly",
    badgeOccasional: "Occasional",
    badgeFrequent: "Recurring",
    badgeCustom: "Bespoke",
    learnMoreEvents: "Want to know more about the events? Discover all our activities",
  },
};

const ca: Dict = {
  nav: {
    home: "Inici",
    about: "Qui som",
    how: "Com funciona",
    activities: "Activitats",
    media: "Media",
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
    reason5: "🏆 Tornejos, slow friending lúdic i esdeveniments especials tot l'any",
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
    legalNotice: "Avís Legal",
    privacy: "Privacitat",
    cookies: "Galetes",
    terms: "Termes",
    cookieSettings: "Preferències de galetes",
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
  how: {
    eyebrow: "Com funciona",
    title: "Així funciona KLEFF",
    intro:
      "Som una associació sense ànim de lucre. Les activitats recurrents són gratuïtes, però l'espai que ens cedeix l'Estació Espai Gastronòmic demana una consumició mínima de 4€ a l'inici de l'activitat. Així donem suport al local que ens obre les portes cada setmana.",
    nonProfitTitle: "Associació sense ànim de lucre",
    nonProfitBody:
      "KLEFF es constitueix formalment com a associació sense finalitat de lucre. Tot el que generem torna a la comunitat: ludoteca, esdeveniments especials i col·laboracions.",
    consumptionBadge: "4€ de consumició · activitat gratuïta",
    howItWorksTitle: "Vens sol, en parella o amb amics. Tant és.",
    howItWorksBody:
      "No cal reservar taula ni portar ningú. El #TeamKLEFF (samarreta vermella) et rep, t'ajuda a trobar taula per començar una partida o t'aparella amb altra gent amb ganes de jugar. En 10 minuts ja estàs rient amb desconeguts.",
    step1Title: "Arribes",
    step1Body:
      "Entres a l'Estació Espai Gastronòmic. Demanes una beguda (això és la consumició de 4€) o alguna cosa per picar. Un membre del #TeamKLEFF et rep a la recepció.",
    step2Title: "Trobes taula",
    step2Body:
      "El #TeamKLEFF (samarreta vermella) hi és per ajudar-te. T'aparellen amb gent que busca taula, et recomanen un joc segons les teves ganes i te l'expliquen si no el coneixes.",
    step3Title: "Jugues i tornes",
    step3Body:
      "Més de 500 jocs disponibles. Quan acabis una partida, prova una altra taula o queda't a la teva. La nit dura 4 hores i ningú no té pressa.",
    activitiesTitle: "Què hi pots trobar",
    activitiesSubtitle:
      "Des de la nit de jocs setmanal fins a tornejos, cites lúdiques i esdeveniments solidaris.",
    weekly: "Setmanal",
    monthly: "Mensual",
    yearly: "Anual",
    occasional: "Puntual",
    activityWeekly1Title: "Nit de Jocs",
    activityWeekly1Body:
      "Esdeveniment regular amb ludoteca oberta i partides programades de Blood on the Clocktower, Catan i molts més.",
    activityOccasional1Title: "Slow Friending Lúdic",
    activityOccasional1Body:
      "Concepte similar al speed dating però amb jocs socials com a excusa per connectar persones.",
    activityMonthly1Title: "Tornejos",
    activityMonthly1Body:
      "Activitat competitiva dels jocs més populars de la comunitat.",
    activityMonthly2Title: "Demostracions d'editorials i autors",
    activityMonthly2Body:
      "Jornades per aprendre jocs nous directament amb qui els ha creat i publicat.",
    activityYearly1Title: "Game Night: Carnival",
    activityYearly1Body:
      "Nit de jocs especial amb concurs de disfresses de carnaval.",
    activityYearly2Title: "Game Night: Halloween",
    activityYearly2Body:
      "Nit de jocs especial amb concurs de disfresses de temàtica Halloween.",
    activityYearly3Title: "X-Mas Game Night",
    activityYearly3Body:
      "Esdeveniment solidari per recaptar fons per a l'Hospital Sant Joan de Déu, especialitzat en càncer infantil.",
    communitiesEyebrow: "Comunitats",
    communitiesTitle: "Vols formar part d'una comunitat específica?",
    communitiesIntro:
      "Dins de KLEFF hi conviuen diverses comunitats al voltant de jocs concrets. Cadascuna té el seu grup, les seves partides regulars i els seus esdeveniments. Uneix-te a la que més t'agradi.",
    community1Title: "Blood on the Clocktower",
    community1Body:
      "Comunitat del joc de rols ocults més ben valorat al rànquing de la BGG. Programem com a mínim 2 partides setmanals.",
    community1Tag: "2 partides/setmana",
    community2Title: "Catan",
    community2Body:
      "Comunitat del precursor dels jocs de taula moderns. Organitzem tornejos i activitats de manera recurrent.",
    community2Tag: "Tornejos recurrents",
    community3Title: "Tornejos",
    community3Body:
      "Comunitat amb tornejos de diferents jocs gairebé cada setmana: Unmatched, Catan, Magic, party games i molt més.",
    community3Tag: "Tornejos gairebé cada setmana",
    community4Title: "Rols Ocults",
    community4Body:
      "Comunitat per descobrir i gaudir de jocs de deducció social i identitats secretes.",
    community4Tag: "Deducció social",
    memberEyebrow: "Fes-te soci",
    memberTitle: "Sigues part real del projecte",
    memberSubtitle:
      "Ser soci de KLEFF no és només donar suport a l'associació: desbloqueja avantatges pensats per a qui ve de veritat.",
    memberFlipHint: "Passa el ratolí sobre cada avantatge",
    benefit1Title: "Lloguer de jocs",
    benefit1Body:
      "Emporta't jocs de la nostra ludoteca de més de 300 títols a casa per un cap de setmana o entre setmana.",
    benefit2Title: "Accés prioritari",
    benefit2Body:
      "Reserva primer plaça en esdeveniments especials, tornejos amb aforament limitat i nits temàtiques.",
    benefit3Title: "Descomptes en botigues",
    benefit3Body:
      "Descomptes en botigues col·laboradores de Barcelona com Mathom, The Curiosity Shop, Gameria o Kaburi.",
    benefit4Title: "Comunitat real",
    benefit4Body:
      "Accés a un canal exclusiu de socis, propostes de millora i vot en les activitats anuals.",
    memberCtaTitle: "A punt per fer-te soci?",
    memberCtaBody:
      "Estem acabant de definir la quota anual i els passos per apuntar-s'hi. Deixa'ns el teu correu i t'avisem quan obrim les inscripcions.",
    memberCta: "Vull més info",
  },
  media: {
    eyebrow: "Media",
    title: "N'han parlat",
    intro:
      "Reportatges, podcasts, articles i reels que han explicat la història de KLEFF. Ordenats de més recent a més antic.",
    pressTitle: "Aparicions a premsa",
    pressSubtitle: "Selecció dels mitjans on hem aparegut els darrers anys.",
    visitArticle: "Veure publicació",
    instagramTitle: "Segueix-nos a Instagram",
    instagramSubtitle:
      "Les millors fotos de cada Game Night, els pròxims esdeveniments i els moments més divertits són a @kleff.bcn.",
    instagramCta: "Obrir @kleff.bcn",
    loading: "Carregant vista prèvia…",
    noPreview: "Vista prèvia no disponible — obre l'enllaç per veure-ho.",
  },
  activities: {
    eyebrow: "Activitats",
    title: "Viu KLEFF",
    intro:
      "La nostra activitat principal és la Nit de Jocs, cada dimecres. A dins hi passen totes les altres coses: tornejos, demostracions, Slow Friending Lúdic i edicions especials temàtiques. Aquí t'ho expliquem tot.",
    ctaMeetup: "Veure pròxims esdeveniments",
    ctaHow: "Com funciona",
    mainEyebrow: "Cada dimecres",
    mainTitle: "La Nit de Jocs",
    mainBody1:
      "La Nit de Jocs és el teu punt de partida per formar part de la comunitat KLEFF. Un afterwork lúdic cada dimecres on pots venir amb amics, companys de feina o tu sol per fer noves amistats — sempre hi ha lloc en alguna taula.",
    mainBody2:
      "És el punt de trobada setmanal per socialitzar, trencar amb la rutina i descobrir que jugar entre adults és la millor excusa per connectar de debò. Sense pressió, sense agenda — només gent amb ganes de passar-s'ho bé.",
    mainCta: "Apunta't a la pròxima Nit de Jocs",
    insideTitle: "Què passa dins de la Nit de Jocs",
    insideSubtitle:
      "A més del joc lliure amb la ludoteca oberta, cada nit hi pot passar alguna cosa diferent.",
    inside1Title: "Tornejos",
    inside1Body:
      "Un cop al mes (de vegades més) organitzem tornejos competitius dels jocs més populars de la comunitat: Catan, Unmatched, Magic, Hidden Roles, party games… Apuntar-s'hi és gratis i hi ha premis per als guanyadors. Ideal si t'agrada l'espurna de la competició sense renunciar al bon ambient.",
    inside2Title: "Demostracions d'editorials i autors",
    inside2Body:
      "Periòdicament convidem editorials i autors a presentar els seus jocs directament a les nostres taules. Aprens el joc de la mà de qui l'ha creat, descobreixes novetats abans que arribin a les botigues i pots resoldre dubtes en directe. Una manera única de veure com es pensa un joc des de dins.",
    inside3Title: "Slow Friending Lúdic",
    inside3Body:
      "La nostra versió del speed dating, però amb jocs socials com a excusa per connectar. Taules rotatives, dinàmiques pensades per trencar el gel i conèixer gent nova sense la pressió incòmoda de les cites tradicionals. Pensat per fer amistats reals (o el que surti).",
    specialEyebrow: "Game Nights especials",
    specialTitle: "Edicions úniques, un cop l'any",
    specialSubtitle:
      "Són Nits de Jocs especials amb temàtica pròpia. Només passen un cop l'any, així que val la pena marcar-les al calendari.",
    special1Title: "Game Night: Carnival",
    special1Body:
      "Nit de jocs amb concurs de disfresses de carnaval. La sala s'omple de purpurina, màscares i molta gent jugant amb vestuari impossible. Premis per a les millors disfresses.",
    special2Title: "Game Night: Halloween",
    special2Body:
      "Edició de terror i misteri. Disfresses obligatòries (o gairebé), jocs temàtics de deducció social i un ambient que només passa un cop l'any. La favorita de molts kleffers.",
    special3Title: "X-Mas Game Night",
    special3Body:
      "Esdeveniment solidari de tancament d'any. Recaptem fons per a l'Hospital Sant Joan de Déu, especialitzat en oncologia infantil. Jocs, sortejos i la satisfacció d'ajudar una bona causa.",
    specialNote:
      "Són edicions especials de la Nit de Jocs: mateix format, mateix local, mateix equip — només amb un toc extra.",
    frequentEyebrow: "Col·laboracions",
    frequentTitle: "Esdeveniments amb espais i entitats aliades",
    frequentBody:
      "De tant en tant sortim del local habitual per organitzar esdeveniments especials en col·laboració amb altres espais de Barcelona — combinant jocs amb gastronomia, tallers o experiències temàtiques. Un exemple recent és la tarda de jocs amb cuina japonesa a Casa Hanaka.",
    frequentExampleTitle: "",
    frequentExampleBody: "",
    partnersEyebrow: "",
    partnersTitle: "",
    partnersBody:
      "A més, col·laborem amb altres associacions i col·lectius que organitzen partides i activitats altres dies de la setmana. Així, si et perds el dimecres, gairebé sempre hi ha un pla lúdic a prop.",
    teamBuildingEyebrow: "A mida",
    teamBuildingTitle: "Vols un esdeveniment privat o team building?",
    teamBuildingBody:
      "Organitzem esdeveniments a mida per a empreses, equips, comiats, aniversaris o qualsevol grup que vulgui viure una experiència lúdica única. Dissenyem la dinàmica, portem els jocs i ens encarreguem que tothom s'ho passi bé — fins i tot qui diu que «no li agraden els jocs de taula».",
    teamBuildingCta: "Contacta amb nosaltres",
    calendarEyebrow: "Calendari",
    calendarTitle: "Vols saber més sobre els esdeveniments?",
    calendarBody:
      "Tots els esdeveniments, dates, descripcions i RSVP són al nostre Meetup. Apuntar-s'hi és gratis i és la millor manera de no perdre't res.",
    calendarCta: "Veure el calendari complet a Meetup",
    calendarGroup: "O explora tot el grup de KLEFF",
    badgeWeekly: "Setmanal",
    badgeMonthly: "Mensual",
    badgeYearly: "Anual",
    badgeOccasional: "Puntual",
    badgeFrequent: "Recurrent",
    badgeCustom: "A mida",
    learnMoreEvents: "Vols saber més sobre els esdeveniments? Descobreix totes les activitats",
  },
};

export const dictionaries: Record<Locale, Dict> = { es, en, ca };
export type { Dict };
