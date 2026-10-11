// Minimal demo game: 4 playable characters (+ victim NPC), 3 acts, 2 joint actions.
export const DEMO_GAME = {
  game: {
    slug: "cena-en-villa-kleff",
    title: "Cena mortal en Villa Kleff",
    synopsis:
      "El excéntrico coleccionista Don Ernesto reúne a cuatro invitados para anunciar su testamento. Antes del postre, las luces se apagan…",
    min_players: 4,
    max_players: 4,
    duration_minutes: 60,
    theme: { primary: "#b91c1c", background: "#140d0b", surface: "#24170f", text: "#f5e9d7", accent: "#d4a24c", font_display: "Playfair Display" },
    murder_event: {
      title: "¡Las luces se apagan!",
      text: "Un grito rompe el silencio. Cuando vuelve la luz, Don Ernesto yace sobre la mesa del comedor. Alguien de esta sala es el culpable.",
      victim_name: "Don Ernesto",
    },
    final_reveal: {
      motive: "Lucía descubrió que Don Ernesto iba a desheredarla y revelar su deuda de juego.",
      method: "Envenenó su copa de oporto con el frasco de láudano robado del botiquín.",
      epilogue: "La policía llegó al amanecer. Villa Kleff nunca volvió a celebrar una cena.",
    },
  },
  acts: [
    { key: "intro", name: "Acto 1 · La cena", narrative_text: "Presentaos y averiguad por qué os ha invitado Don Ernesto.", duration_minutes: 15 },
    { key: "investigation", name: "Acto 2 · La investigación", narrative_text: "Don Ernesto ha muerto. Registrad la casa y cruzad vuestras pistas.", duration_minutes: 30 },
    { key: "conclusion", name: "Acto 3 · La acusación", narrative_text: "Ha llegado el momento: ¿quién lo hizo, por qué y cómo?", duration_minutes: 15 },
  ],
  characters: [
    {
      ref: "lucia",
      name: "Lucía Montero",
      description: "Sobrina de Don Ernesto, encantadora y siempre endeudada.",
      alibi: "Dice que estaba en el jardín fumando.",
      relationships: [{ ref: "tomas", text: "Su antiguo prometido" }],
      is_killer: true,
      avatar_config: { top: ["longButNotTooLong"], hairColor: ["a55728"], clothing: ["blazerAndShirt"], accessoriesProbability: 0 },
      secrets: [{ content: "Debes 20.000 € a un prestamista y Don Ernesto lo sabía.", known_by: [] }],
      objectives: [
        { act: "intro", text: "Consigue que alguien confirme tu coartada del jardín.", points: 2 },
        { act: "investigation", text: "Haz que se sospeche de otra persona.", points: 3 },
      ],
      abilities: [{ name: "Falsificar", description: "Cambia una pista ante otro jugador.", effect_type: "forge", max_uses: 1 }],
      items: [{ name: "Frasco vacío", description: "Huele a láudano. Deberías deshacerte de él." }],
      fragments: [{ label: "Mitad de una nota", value: "…a medianoche en el", group_key: "nota" }],
    },
    {
      ref: "tomas",
      name: "Tomás Rivas",
      description: "Mayordomo de la casa desde hace veinte años.",
      alibi: "Servía el oporto en el salón.",
      avatar_config: { top: ["shortFlat"], hairColor: ["2c1b18"], facialHair: ["moustacheFancy"], facialHairProbability: 100, clothing: ["shirtVNeck"] },
      secrets: [{ content: "Viste a Lucía salir del botiquín antes de la cena.", known_by: [] }],
      objectives: [
        { act: "intro", text: "Sirve el oporto y observa quién se acerca a la copa de Don Ernesto.", points: 1 },
        { act: "investigation", text: "Comparte lo que viste solo con quien te inspire confianza.", points: 2 },
      ],
      abilities: [{ name: "Vigilar", description: "Observa a un jugador durante un acto.", effect_type: "watch", max_uses: 2 }],
      items: [{ name: "Llave del botiquín", description: "Faltaba en el llavero esta tarde." }],
      fragments: [{ label: "Mitad de una nota", value: "invernadero. No faltes. — E.", group_key: "nota" }],
    },
    {
      ref: "carmen",
      name: "Doctora Carmen Vidal",
      description: "Médica de la familia y vieja amiga de Don Ernesto.",
      alibi: "Estaba en la biblioteca leyendo.",
      avatar_config: { top: ["bob"], hairColor: ["4a312c"], accessories: ["prescription02"], accessoriesProbability: 100, clothing: ["collarAndSweater"] },
      secrets: [{ content: "Echaste en falta un frasco de láudano de tu maletín.", known_by: ["tomas"] }],
      objectives: [{ act: "investigation", text: "Examina el cuerpo y determina la causa de la muerte.", points: 3 }],
      abilities: [{ name: "Examinar", description: "Analiza una evidencia en profundidad.", effect_type: "examine", max_uses: 2, available_from_act: "investigation" }],
      items: [{ name: "Maletín médico", description: "Falta un frasco." }],
    },
    {
      ref: "hugo",
      name: "Hugo Ferrer",
      description: "Abogado de Don Ernesto, custodio del testamento.",
      alibi: "Hablaba por teléfono en el despacho.",
      avatar_config: { top: ["shortWaved"], hairColor: ["b58143"], clothing: ["blazerAndSweater"], accessoriesProbability: 0 },
      secrets: [{ content: "El nuevo testamento deshereda a Lucía.", known_by: [] }],
      objectives: [
        { act: "intro", text: "Insinúa que el testamento traerá sorpresas sin revelar cuáles.", points: 1 },
        { act: "conclusion", text: "Acusa correctamente al culpable.", completion_type: "admin", points: 2 },
      ],
      abilities: [{ name: "Interrogar", description: "Obliga a un jugador a responder sí o no.", effect_type: "interrogate", max_uses: 1 }],
      items: [{ name: "Testamento sellado", description: "Fechado ayer." }],
    },
  ],
  evidences: [
    { act: "investigation", title: "La copa de oporto", content: "Restos de un líquido amargo en el fondo de la copa de Don Ernesto.", scope: "common" },
    { act: "investigation", title: "Informe de la doctora", content: "Pupilas contraídas: compatible con envenenamiento por opiáceos.", scope: "personal", target: "carmen" },
    { act: "investigation", title: "Nota completa", content: "«Te espero a medianoche en el invernadero. No faltes. — E.»", scope: "common", unlock_rule: { type: "fragments", group_key: "nota" } },
  ],
  joint_actions: [
    {
      name: "Abrir el botiquín",
      description: "Hace falta la llave del mayordomo y el ojo experto de la doctora.",
      available_from_act: "investigation",
      requirements: [
        { role: "llave", character: "tomas", item: "Llave del botiquín" },
        { role: "experta", character: "carmen", ability: "Examinar" },
      ],
      results: [
        { role: "llave", text: "Ves que falta exactamente un frasco." },
        { role: "experta", text: "El frasco que falta es láudano: el mismo veneno de la copa." },
      ],
    },
    {
      name: "Leer el testamento",
      description: "El abogado lo abre ante un testigo.",
      available_from_act: "investigation",
      requirements: [
        { role: "abogado", character: "hugo", item: "Testamento sellado" },
        { role: "testigo", character: "cualquiera" },
      ],
      results: [
        { role: "abogado", text: "Confirmas en voz alta que Lucía queda desheredada." },
        { role: "testigo", text: "Lucía tenía mucho que perder con este testamento." },
      ],
    },
  ],
};
