// @ts-nocheck
// Emoji palette for the «Emoji Story» icebreaker, grouped in simple categories.
export interface EmojiCategory {
  id: string;
  label_es: string;
  label_en: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "travel",
    label_es: "Viajes",
    label_en: "Travel",
    emojis: ["✈️", "🚗", "🚂", "🛳️", "🏝️", "🏔️", "🏕️", "🗺️", "🎒", "🧳", "🌍", "🏛️", "🌅", "⛺", "🚐", "🛶"],
  },
  {
    id: "food",
    label_es: "Comida",
    label_en: "Food",
    emojis: ["🍕", "🍔", "🌮", "🍣", "🥘", "🍝", "🥗", "🍩", "🍦", "🍫", "☕", "🍷", "🍺", "🥂", "🍾", "🧉"],
  },
  {
    id: "feelings",
    label_es: "Emociones",
    label_en: "Feelings",
    emojis: ["😂", "🥹", "😍", "😱", "🤯", "😴", "🤔", "😎", "🥳", "😳", "🤗", "😭", "❤️", "💔", "✨", "🔥"],
  },
  {
    id: "activities",
    label_es: "Actividades",
    label_en: "Activities",
    emojis: ["⚽", "🏀", "🎾", "🏄", "🚴", "🧘", "🏋️", "🎮", "🎸", "🎤", "🎧", "🎨", "📚", "🎬", "💃", "🕺"],
  },
  {
    id: "animals",
    label_es: "Animales",
    label_en: "Animals",
    emojis: ["🐶", "🐱", "🐴", "🐢", "🐬", "🦋", "🐝", "🦉", "🦊", "🐧", "🦁", "🐨", "🦜", "🐙", "🦄", "🐌"],
  },
  {
    id: "objects",
    label_es: "Objetos",
    label_en: "Objects",
    emojis: ["📱", "💻", "📷", "🎁", "🔑", "💡", "⏰", "🚀", "🛠️", "💰", "🩹", "🧩", "🎲", "📝", "🏆", "🎯"],
  },
];

export const MIN_STORY_EMOJIS = 4;
export const MAX_STORY_EMOJIS = 6;
