import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";

type Milestone = {
  year: string;
  emoji: string;
  title: { es: string; en: string; ca: string };
  body: { es: string; en: string; ca: string };
};

const MILESTONES: Milestone[] = [
  {
    year: "2018",
    emoji: "🌱",
    title: {
      es: "Una receta inesperada",
      en: "An unexpected prescription",
      ca: "Una recepta inesperada",
    },
    body: {
      es: "Pau atraviesa una depresión. La psicóloga le receta algo poco común: salir, probar, conocer gente. Idiomas, teatro, fotografía… y un Meetup de juegos de mesa que lo cambiaría todo.",
      en: "Pau goes through depression. The therapist prescribes something unusual: get out, try things, meet people. Languages, theatre, photography… and a board games Meetup that would change everything.",
      ca: "En Pau travessa una depressió. La psicòloga li recepta una cosa poc comuna: sortir, provar, conèixer gent. Idiomes, teatre, fotografia… i un Meetup de jocs de taula que ho canviaria tot.",
    },
  },
  {
    year: "2019 (I)",
    emoji: "🎲",
    title: {
      es: "Martes de juegos, domingos al sol",
      en: "Tuesday game nights, sunny Sundays",
      ca: "Dimarts de jocs, diumenges al sol",
    },
    body: {
      es: "Pau empieza a organizar martes noche de juegos y desayunos dominicales con juegos en el Parc de la Ciutadella.",
      en: "Pau starts hosting Tuesday game nights and Sunday brunch-with-games at Parc de la Ciutadella.",
      ca: "En Pau comença a organitzar dimarts nit de jocs i esmorzars dominicals amb jocs al Parc de la Ciutadella.",
    },
  },
  {
    year: "OCT 2019",
    emoji: "🎉",
    title: {
      es: "Nace KLEFF",
      en: "KLEFF is born",
      ca: "Neix KLEFF",
    },
    body: {
      es: "Tras un año reuniéndose cada semana, Pau y su socio fundan KLEFF. Era hora de convertir aquella afición en comunidad.",
      en: "After a year of weekly meetings, Pau and his partner found KLEFF. Time to turn the hobby into a community.",
      ca: "Després d'un any trobant-se cada setmana, en Pau i el seu soci funden KLEFF. Era hora de convertir l'afició en comunitat.",
    },
  },
  {
    year: "2019 (II)",
    emoji: "🍻",
    title: {
      es: "+30 personas cada semana",
      en: "30+ people every week",
      ca: "+30 persones cada setmana",
    },
    body: {
      es: "La noche de juegos semanal se establece como evento fijo. Las mesas se llenan, los desconocidos se hacen amigos.",
      en: "The weekly game night becomes a regular thing. Tables fill up, strangers turn into friends.",
      ca: "La nit de jocs setmanal s'estableix com a esdeveniment fix. Les taules s'omplen, els desconeguts es fan amics.",
    },
  },
  {
    year: "2020-21",
    emoji: "🕵️",
    title: {
      es: "Pandemia y Treasure Hunts",
      en: "Pandemic and Treasure Hunts",
      ca: "Pandèmia i Treasure Hunts",
    },
    body: {
      es: "Seguimos jugando online y, después, presencial al aire libre. Nacen los Treasure Hunt: «Descubre Barcelona», «Movie's Walk» y «El Caso Méliès».",
      en: "We keep playing online, then outdoors. The Treasure Hunts are born: 'Discover Barcelona', 'Movie's Walk' and 'The Méliès Case'.",
      ca: "Seguim jugant online i, després, presencial a l'aire lliure. Neixen els Treasure Hunt: «Descobreix Barcelona», «Movie's Walk» i «El Cas Méliès».",
    },
  },
  {
    year: "2021",
    emoji: "🍽️",
    title: {
      es: "Pasatapas, casa nueva",
      en: "New home: Pasatapas",
      ca: "Pasatapas, nova casa",
    },
    body: {
      es: "Nos instalamos en el Restaurante Pasatapas. KLEFF se convierte en la comunidad de juegos de mesa más grande de Barcelona.",
      en: "We move into Restaurante Pasatapas. KLEFF becomes Barcelona's biggest board game community.",
      ca: "Ens instal·lem al Restaurant Pasatapas. KLEFF esdevé la comunitat de jocs de taula més gran de Barcelona.",
    },
  },
  {
    year: "2023",
    emoji: "🎬",
    title: {
      es: "Boardgaming for Fun",
      en: "Boardgaming for Fun",
      ca: "Boardgaming for Fun",
    },
    body: {
      es: "Junto con Mathom organizamos «Barcelona Boardgaming for Fun» en el Movistar Centre, mezclando juegos y exposiciones audiovisuales.",
      en: "With Mathom we organize 'Barcelona Boardgaming for Fun' at Movistar Centre, mixing games and audiovisual exhibitions.",
      ca: "Amb Mathom organitzem «Barcelona Boardgaming for Fun» al Movistar Centre, barrejant jocs i exposicions audiovisuals.",
    },
  },
  {
    year: "2025",
    emoji: "🚉",
    title: {
      es: "L'Estació, +200 por noche",
      en: "L'Estació, 200+ per night",
      ca: "L'Estació, +200 per nit",
    },
    body: {
      es: "KLEFF se reinventa: nueva sede en L'Estació – Espai Gastronòmic, más colaboradores y noches multitudinarias con más de 200 asistentes.",
      en: "KLEFF reinvents itself: new home at L'Estació – Espai Gastronòmic, more contributors and packed nights of 200+ attendees.",
      ca: "KLEFF es reinventa: nova seu a L'Estació – Espai Gastronòmic, més col·laboradors i nits multitudinàries amb més de 200 assistents.",
    },
  },
  {
    year: "2026",
    emoji: "📜",
    title: {
      es: "Asociación oficial",
      en: "Official association",
      ca: "Associació oficial",
    },
    body: {
      es: "KLEFF se constituye formalmente como asociación sin ánimo de lucro. Lo que empezó como terapia, hoy es movimiento.",
      en: "KLEFF formally registers as a non-profit association. What started as therapy is now a movement.",
      ca: "KLEFF es constitueix formalment com a associació sense ànim de lucre. El que va començar com a teràpia, avui és moviment.",
    },
  },
];

export function HistoryTimeline({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`snake-timeline ${visible ? "is-visible" : ""}`}
    >
      {MILESTONES.map((m, i) => {
        const delay = i * 180;
        return (
          <article
            key={m.year}
            className="snake-card"
            style={{ ["--reveal-delay" as string]: `${delay}ms` }}
          >
            <span className="snake-step" aria-label={`Paso ${i + 1}`}>{i + 1}</span>
            <span className="snake-emoji" aria-hidden>{m.emoji}</span>
            <span className="snake-year">{m.year}</span>
            <h3 className="mt-3 font-display font-bold text-lg leading-tight text-foreground">
              {m.title[locale]}
            </h3>
            <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
              {m.body[locale]}
            </p>
          </article>
        );
      })}
    </div>
  );
}
