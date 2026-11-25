import type { HitsterLang } from "./hitster";

const DICT = {
  sideA: { es: "Cara A · Principiante", ca: "Cara A · Principiant", en: "Side A · Beginner" },
  sideB: { es: "Cara B · Experto", ca: "Cara B · Expert", en: "Side B · Expert" },
  createTitle: { es: "Crea tu perfil", ca: "Crea el teu perfil", en: "Create your profile" },
  nicknameLabel: { es: "Tu pseudónimo", ca: "El teu pseudònim", en: "Your nickname" },
  nicknamePlaceholder: { es: "Ej. DJ Vinyl", ca: "Ex. DJ Vinyl", en: "e.g. DJ Vinyl" },
  randomAvatar: { es: "Aleatorio", ca: "Aleatori", en: "Random" },
  customizeAvatar: { es: "Personalizar", ca: "Personalitzar", en: "Customise" },
  uploadPhoto: { es: "Subir foto", ca: "Pujar foto", en: "Upload photo" },
  joinBtn: { es: "Entrar a la partida", ca: "Entrar a la partida", en: "Join game" },
  haveCode: { es: "Ya tengo código personal", ca: "Ja tinc codi personal", en: "I already have a code" },
  backCreate: { es: "Crear perfil nuevo", ca: "Crear perfil nou", en: "Create new profile" },
  codePlaceholder: { es: "Código de 6 letras", ca: "Codi de 6 lletres", en: "6-letter code" },
  recoverBtn: { es: "Recuperar mi tablero", ca: "Recuperar el meu tauler", en: "Recover my board" },
  yourCodeTitle: { es: "Guarda tu código personal", ca: "Desa el teu codi personal", en: "Save your personal code" },
  yourCodeDesc: {
    es: "Si cierras el navegador, podrás volver a entrar a tu tablero con este código.",
    ca: "Si tanques el navegador, podràs tornar a entrar al teu tauler amb aquest codi.",
    en: "If you close the browser, you can return to your board with this code.",
  },
  startPlaying: { es: "Ir a mi tablero", ca: "Anar al meu tauler", en: "Go to my board" },
  tabBoard: { es: "Tablero", ca: "Tauler", en: "Board" },
  tabCategories: { es: "Categorías", ca: "Categories", en: "Categories" },
  tabParticipants: { es: "Participantes", ca: "Participants", en: "Players" },
  waitingStart: {
    es: "Esperando a que el anfitrión empiece la partida…",
    ca: "Esperant que l'amfitrió comenci la partida…",
    en: "Waiting for the host to start the game…",
  },
  waitingRound: {
    es: "Prepárate… Esperando la siguiente categoría.",
    ca: "Prepara't… Esperant la següent categoria.",
    en: "Get ready… Waiting for the next category.",
  },
  roundLabel: { es: "Ronda", ca: "Ronda", en: "Round" },
  answerLabel: { es: "Tu respuesta", ca: "La teva resposta", en: "Your answer" },
  saveAnswer: { es: "Guardar respuesta", ca: "Desar resposta", en: "Save answer" },
  answerSaved: { es: "Respuesta guardada", ca: "Resposta desada", en: "Answer saved" },
  timeUp: {
    es: "Tiempo agotado · Esperando a que se anuncie la solución…",
    ca: "Temps esgotat · Esperant que s'anunciï la solució…",
    en: "Time's up · Waiting for the host to announce the answer…",
  },
  validateTitle: { es: "¿Has acertado?", ca: "Has encertat?", en: "Did you get it right?" },
  yourAnswerWas: { es: "Tu respuesta:", ca: "La teva resposta:", en: "Your answer:" },
  noAnswerWritten: { es: "(sin respuesta)", ca: "(sense resposta)", en: "(no answer)" },
  noAnswerSent: {
    es: "No enviaste respuesta en esta ronda.",
    ca: "No vas enviar resposta en aquesta ronda.",
    en: "You didn't submit an answer in this round.",
  },
  yesCorrect: { es: "¡Sí, acerté!", ca: "Sí, he encertat!", en: "Yes, got it!" },
  yesExact: { es: "¡Año exacto! (+quitar cruz)", ca: "Any exacte! (+treure creu)", en: "Exact year! (+remove cross)" },
  noWrong: { es: "No acerté", ca: "No he encertat", en: "Missed it" },
  pickCellHint: {
    es: "¡Toca una casilla libre del color activo en tu tablero para marcarla!",
    ca: "Toca una casella lliure del color actiu al teu tauler per marcar-la!",
    en: "Tap an unmarked square of the active colour on your board to mark it!",
  },
  allColorMarked: {
    es: "Ya tienes las 5 casillas de este color marcadas.",
    ca: "Ja tens les 5 caselles d'aquest color marcades.",
    en: "You already have all 5 squares of this colour marked.",
  },
  markedDone: { es: "¡Casilla marcada!", ca: "Casella marcada!", en: "Square marked!" },
  missedRound: { es: "Sin punto en esta ronda. ¡A por la siguiente!", ca: "Sense punt en aquesta ronda. A per la següent!", en: "No point this round. Onto the next!" },
  punishBtn: { es: "Quitar cruz a un rival", ca: "Treure creu a un rival", en: "Remove a rival's cross" },
  punishTitle: { es: "Elige a un rival y quítale una cruz", ca: "Tria un rival i treu-li una creu", en: "Pick a rival and remove a cross" },
  punishPickRival: { es: "Elige a qué adversario castigar:", ca: "Tria quin adversari castigar:", en: "Choose which opponent to target:" },
  punishPickCell: { es: "Toca la cruz que quieres borrarle:", ca: "Toca la creu que li vols esborrar:", en: "Tap the cross you want to remove:" },
  punishNoMarks: { es: "Ningún rival tiene cruces todavía.", ca: "Cap rival té creus encara.", en: "No opponent has any crosses yet." },
  punishDone: { es: "¡Cruz eliminada al rival!", ca: "Creu eliminada al rival!", en: "Rival's cross removed!" },
  backToRivals: { es: "Cambiar rival", ca: "Canviar rival", en: "Change rival" },
  tiebreakBanner: {
    es: "¡Empate! Compiten los jugadores empatados: gana el primero en acertar la siguiente.",
    ca: "Empat! Competeixen els jugadors empatats: guanya el primer a encertar la següent.",
    en: "Tiebreak! Tied players compete: first to get the next answer right wins.",
  },
  tiebreakSpectator: {
    es: "Hay un desempate en curso entre otros jugadores.",
    ca: "Hi ha un desempat en curs entre altres jugadors.",
    en: "A tiebreak is underway between other players.",
  },
  winnerBanner: { es: "¡Partida terminada! Ganador:", ca: "Partida acabada! Guanyador:", en: "Game over! Winner:" },
  notFound: { es: "Partida no encontrada", ca: "Partida no trobada", en: "Game not found" },
  codeLabel: { es: "Código:", ca: "Codi:", en: "Code:" },
  categoriesIntro: {
    es: "Estas son las 5 categorías de esta partida y su color en el tablero 5×5:",
    ca: "Aquestes són les 5 categories d'aquesta partida i el seu color al tauler 5×5:",
    en: "These are the 5 categories in this game and their colours on the 5×5 board:",
  },
  participantsIntro: {
    es: "Progreso en directo de todos los jugadores:",
    ca: "Progrés en directe de tots els jugadors:",
    en: "Live progress of all players:",
  },
  lineDone: { es: "¡Línea!", ca: "Línia!", en: "Line!" },
} as const;

export type HitsterTKey = keyof typeof DICT;

export function ht(key: HitsterTKey, lang: HitsterLang): string {
  return DICT[key][lang];
}