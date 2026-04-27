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

/**
 * Connectors between cards in the grid. Three types:
 *  - "right":   horizontal arrow from card N to card N+1 in the same row
 *  - "wrap":    long curved arrow from end of row to start of next row
 *  - "down":    short vertical arrow (used in 1-col mobile and 2-col tablet)
 *
 * The connectors are absolutely positioned inside the timeline grid using
 * `grid-column` / `grid-row`, so they always sit between the two cards they
 * link, regardless of card height.
 */

type ConnectorKind = "right" | "wrap" | "down";

type Connector = {
  index: number; // index of the source card (0-based)
  kind: ConnectorKind;
  // grid coords (1-based) for the source card
  col: number;
  row: number;
};

function buildConnectors(total: number, cols: number): Connector[] {
  const connectors: Connector[] = [];
  for (let i = 0; i < total - 1; i++) {
    const col = (i % cols) + 1;
    const row = Math.floor(i / cols) + 1;
    const isRowEnd = col === cols;
    if (cols === 1) {
      connectors.push({ index: i, kind: "down", col, row });
    } else if (isRowEnd) {
      connectors.push({ index: i, kind: "wrap", col, row });
    } else {
      connectors.push({ index: i, kind: "right", col, row });
    }
  }
  return connectors;
}

function useColumns(): number {
  const [cols, setCols] = useState<number>(() => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 640px)").matches) return 2;
    return 1;
  });

  useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const md = window.matchMedia("(min-width: 640px)");
    const update = () => {
      if (lg.matches) setCols(3);
      else if (md.matches) setCols(2);
      else setCols(1);
    };
    update();
    lg.addEventListener("change", update);
    md.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      md.removeEventListener("change", update);
    };
  }, []);

  return cols;
}

export function HistoryTimeline({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const cols = useColumns();
  const connectors = buildConnectors(MILESTONES.length, cols);

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
      data-cols={cols}
    >
      {MILESTONES.map((m, i) => {
        const delay = i * 180;
        return (
          <article
            key={m.year}
            className="snake-card"
            style={{
              ["--reveal-delay" as string]: `${delay}ms`,
              gridColumn: `${(i % cols) + 1} / span 1`,
              gridRow: `${Math.floor(i / cols) * 2 + 1} / span 1`,
            }}
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

      {/* Connectors */}
      {connectors.map((c) => (
        <Connector key={`c-${c.index}`} c={c} cols={cols} delay={c.index * 180 + 350} />
      ))}
    </div>
  );
}

function Connector({
  c,
  cols,
  delay,
}: {
  c: Connector;
  cols: number;
  delay: number;
}) {
  const stepLabel = c.index + 2; // arrow points to step (i+2)

  if (c.kind === "right") {
    // Sits in the gap between this card and the next one (same row)
    return (
      <div
        className="snake-arrow snake-arrow-right"
        style={{
          gridColumn: `${c.col} / span 2`,
          gridRow: `${(c.row - 1) * 2 + 1} / span 1`,
          ["--arrow-delay" as string]: `${delay}ms`,
        }}
        aria-hidden
      >
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="snake-arrow-svg">
          <defs>
            <marker
              id={`arrowhead-r-${c.index}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--coral-deep)" />
            </marker>
          </defs>
          <path
            d="M 2 12 L 92 12"
            fill="none"
            stroke="var(--coral-deep)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="6 7"
            markerEnd={`url(#arrowhead-r-${c.index})`}
            className="snake-arrow-path"
          />
        </svg>
        <span className="snake-arrow-num">{stepLabel}</span>
      </div>
    );
  }

  if (c.kind === "down") {
    // Single column: short vertical arrow between rows
    return (
      <div
        className="snake-arrow snake-arrow-down"
        style={{
          gridColumn: `1 / span 1`,
          gridRow: `${(c.row - 1) * 2 + 2} / span 1`,
          ["--arrow-delay" as string]: `${delay}ms`,
        }}
        aria-hidden
      >
        <svg viewBox="0 0 24 60" preserveAspectRatio="none" className="snake-arrow-svg">
          <defs>
            <marker
              id={`arrowhead-d-${c.index}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--coral-deep)" />
            </marker>
          </defs>
          <path
            d="M 12 4 L 12 52"
            fill="none"
            stroke="var(--coral-deep)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="6 7"
            markerEnd={`url(#arrowhead-d-${c.index})`}
            className="snake-arrow-path"
          />
        </svg>
        <span className="snake-arrow-num">{stepLabel}</span>
      </div>
    );
  }

  // wrap: end of row → start of next row (1→2→3 then 4→5→6)
  // Spans the entire row width and the gap between rows.
  return (
    <div
      className="snake-arrow snake-arrow-wrap"
      style={{
        gridColumn: `1 / span ${cols}`,
        gridRow: `${(c.row - 1) * 2 + 2} / span 1`,
        ["--arrow-delay" as string]: `${delay}ms`,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 600 80" preserveAspectRatio="none" className="snake-arrow-svg">
        <defs>
          <marker
            id={`arrowhead-w-${c.index}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--coral-deep)" />
          </marker>
        </defs>
        {/* Curve: starts at right edge (below card 3), goes down-and-around,
            sweeps across to the left edge, ends pointing down to card 4 */}
        <path
          d="M 580 0 C 600 40, 600 70, 540 72 L 60 72 C 0 70, 0 40, 20 80"
          fill="none"
          stroke="var(--coral-deep)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="6 7"
          markerEnd={`url(#arrowhead-w-${c.index})`}
          className="snake-arrow-path"
        />
      </svg>
      <span className="snake-arrow-num snake-arrow-num-wrap">{stepLabel}</span>
    </div>
  );
}
