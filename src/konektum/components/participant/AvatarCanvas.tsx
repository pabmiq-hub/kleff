// @ts-nocheck
import { colorFor, DEFAULT_AVATAR, DRAWING_SLOT_BOXES, type AvatarLayers } from "@/konektum/lib/avatarPieces";

interface Props {
  layers?: AvatarLayers | null;
  drawing?: string | null;
  size?: number;
  className?: string;
  animate?: boolean;
}

const HAIR_SHAPES: Record<string, (hair: string) => JSX.Element | null> = {
  none: () => null,
  short: (h) => <path d="M52 78 Q52 34 100 34 Q148 34 148 78 Q148 56 100 56 Q52 56 52 78 Z" fill={h} />,
  quiff: (h) => (
    <g fill={h}>
      <path d="M54 74 Q54 32 100 32 Q150 32 148 74 Q140 52 100 52 Q60 52 54 74 Z" />
      <path d="M96 34 Q104 8 136 12 Q112 20 118 38 Z" />
    </g>
  ),
  long: (h) => (
    <g fill={h}>
      <path d="M50 80 Q50 32 100 32 Q150 32 150 80 Q150 58 100 58 Q50 58 50 80 Z" />
      <path d="M46 66 Q40 130 52 150 Q58 118 56 74 Z" />
      <path d="M154 66 Q160 130 148 150 Q142 118 144 74 Z" />
    </g>
  ),
  bun: (h) => (
    <g fill={h}>
      <path d="M54 76 Q54 34 100 34 Q146 34 146 76 Q140 54 100 54 Q60 54 54 76 Z" />
      <circle cx="100" cy="22" r="14" />
    </g>
  ),
  curly: (h) => (
    <g fill={h}>
      <circle cx="70" cy="52" r="18" />
      <circle cx="100" cy="40" r="20" />
      <circle cx="130" cy="52" r="18" />
      <circle cx="56" cy="70" r="13" />
      <circle cx="144" cy="70" r="13" />
    </g>
  ),
  pigtails: (h) => (
    <g fill={h}>
      <path d="M54 76 Q54 34 100 34 Q146 34 146 76 Q140 54 100 54 Q60 54 54 76 Z" />
      <circle cx="42" cy="86" r="16" />
      <circle cx="158" cy="86" r="16" />
    </g>
  ),
  beanie: (h) => (
    <g>
      <path d="M52 74 Q52 30 100 30 Q148 30 148 74 Z" fill={h} />
      <rect x="48" y="70" width="104" height="14" rx="7" fill="#FFFFFF" opacity="0.85" />
    </g>
  ),
};

const EYES: Record<string, JSX.Element> = {
  dots: (
    <g fill="#2B2B33">
      <rect x="78" y="92" width="10" height="10" rx="3" />
      <rect x="112" y="92" width="10" height="10" rx="3" />
    </g>
  ),
  happy: (
    <g stroke="#2B2B33" strokeWidth="4" fill="none" strokeLinecap="round">
      <path d="M76 100 Q83 90 90 100" />
      <path d="M110 100 Q117 90 124 100" />
    </g>
  ),
  wink: (
    <g>
      <rect x="78" y="92" width="10" height="10" rx="3" fill="#2B2B33" />
      <path d="M110 98 Q117 90 124 98" stroke="#2B2B33" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  ),
  sleepy: (
    <g stroke="#2B2B33" strokeWidth="4" strokeLinecap="round">
      <path d="M76 97 H90" />
      <path d="M110 97 H124" />
    </g>
  ),
  wide: (
    <g>
      <circle cx="83" cy="97" r="8" fill="#FFFFFF" stroke="#2B2B33" strokeWidth="3" />
      <circle cx="117" cy="97" r="8" fill="#FFFFFF" stroke="#2B2B33" strokeWidth="3" />
      <circle cx="83" cy="97" r="3.5" fill="#2B2B33" />
      <circle cx="117" cy="97" r="3.5" fill="#2B2B33" />
    </g>
  ),
  stars: (
    <g fill="#2B2B33">
      <path d="M83 88 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" />
      <path d="M117 88 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" />
    </g>
  ),
};

const MOUTHS: Record<string, JSX.Element> = {
  smile: <path d="M86 114 Q100 126 114 114" stroke="#2B2B33" strokeWidth="4" fill="none" strokeLinecap="round" />,
  grin: (
    <g>
      <path d="M84 112 Q100 130 116 112 Z" fill="#FFFFFF" stroke="#2B2B33" strokeWidth="3" />
    </g>
  ),
  smirk: <path d="M88 118 Q102 122 114 112" stroke="#2B2B33" strokeWidth="4" fill="none" strokeLinecap="round" />,
  oh: <circle cx="100" cy="117" r="7" fill="#2B2B33" />,
  serious: <path d="M88 117 H112" stroke="#2B2B33" strokeWidth="4" strokeLinecap="round" />,
  tongue: (
    <g>
      <path d="M84 112 Q100 130 116 112 Z" fill="#FFFFFF" stroke="#2B2B33" strokeWidth="3" />
      <path d="M94 122 Q100 132 106 122 Z" fill="#E85D6E" />
    </g>
  ),
};

const FACIAL: Record<string, (h: string) => JSX.Element | null> = {
  none: () => null,
  mustache: (h) => <path d="M86 110 Q100 104 114 110 Q100 114 86 110 Z" fill={h} />,
  goatee: (h) => <path d="M92 126 Q100 138 108 126 Z" fill={h} />,
  beard: (h) => <path d="M62 100 Q64 140 100 142 Q136 140 138 100 Q130 126 100 126 Q70 126 62 100 Z" fill={h} />,
  full: (h) => (
    <g fill={h}>
      <path d="M58 94 Q58 148 100 150 Q142 148 142 94 Q136 130 100 130 Q64 130 58 94 Z" />
      <path d="M86 108 Q100 102 114 108 Q100 113 86 108 Z" />
    </g>
  ),
};

const CLOTHES: Record<string, (c: string, skin: string) => JSX.Element> = {
  tee: (c) => <path d="M30 200 Q30 146 100 146 Q170 146 170 200 Z" fill={c} />,
  vneck: (c, skin) => (
    <g>
      <path d="M30 200 Q30 146 100 146 Q170 146 170 200 Z" fill={c} />
      <path d="M88 148 L100 172 L112 148 Z" fill={skin} />
    </g>
  ),
  hoodie: (c) => (
    <g>
      <path d="M26 200 Q26 144 100 144 Q174 144 174 200 Z" fill={c} />
      <path d="M70 146 Q100 166 130 146 Q130 158 100 176 Q70 158 70 146 Z" fill="#FFFFFF" opacity="0.35" />
      <rect x="96" y="150" width="8" height="34" rx="4" fill="#FFFFFF" opacity="0.5" />
    </g>
  ),
  shirt: (c, skin) => (
    <g>
      <path d="M30 200 Q30 146 100 146 Q170 146 170 200 Z" fill={c} />
      <path d="M86 148 L100 174 L114 148 Z" fill={skin} />
      <path d="M100 176 V200" stroke="#FFFFFF" strokeWidth="4" opacity="0.6" />
    </g>
  ),
  stripes: (c) => (
    <g>
      <path d="M30 200 Q30 146 100 146 Q170 146 170 200 Z" fill={c} />
      <g fill="#FFFFFF" opacity="0.6">
        <rect x="28" y="158" width="144" height="8" />
        <rect x="28" y="176" width="144" height="8" />
        <rect x="28" y="194" width="144" height="8" />
      </g>
    </g>
  ),
  overalls: (c) => (
    <g>
      <path d="M30 200 Q30 146 100 146 Q170 146 170 200 Z" fill="#F6EEDC" />
      <path d="M58 200 Q58 160 100 158 Q142 160 142 200 Z" fill={c} />
      <rect x="74" y="146" width="9" height="24" fill={c} />
      <rect x="117" y="146" width="9" height="24" fill={c} />
    </g>
  ),
};

const GLASSES: Record<string, JSX.Element | null> = {
  none: null,
  round: (
    <g stroke="#2B2B33" strokeWidth="4" fill="none">
      <circle cx="83" cy="97" r="14" />
      <circle cx="117" cy="97" r="14" />
      <path d="M97 97 H103" />
    </g>
  ),
  square: (
    <g stroke="#2B2B33" strokeWidth="4" fill="none">
      <rect x="68" y="85" width="28" height="24" rx="5" />
      <rect x="104" y="85" width="28" height="24" rx="5" />
      <path d="M96 96 H104" />
    </g>
  ),
  sun: (
    <g>
      <rect x="66" y="84" width="30" height="24" rx="6" fill="#2B2B33" />
      <rect x="104" y="84" width="30" height="24" rx="6" fill="#2B2B33" />
      <path d="M96 92 H104" stroke="#2B2B33" strokeWidth="5" />
    </g>
  ),
  sport: (
    <g>
      <path d="M64 86 Q100 78 136 86 Q136 108 100 108 Q64 108 64 86 Z" fill="#4FE0B5" opacity="0.9" />
      <path d="M64 86 Q100 78 136 86" stroke="#2B2B33" strokeWidth="4" fill="none" />
    </g>
  ),
};

const ACCESSORY: Record<string, (hair: string) => JSX.Element | null> = {
  none: () => null,
  headphones: () => (
    <g>
      <path d="M50 92 Q50 40 100 40 Q150 40 150 92" stroke="#41414B" strokeWidth="8" fill="none" />
      <rect x="38" y="82" width="20" height="30" rx="8" fill="#41414B" />
      <rect x="142" y="82" width="20" height="30" rx="8" fill="#41414B" />
      <rect x="38" y="90" width="20" height="6" fill="#4FE0B5" />
      <rect x="142" y="90" width="20" height="6" fill="#4FE0B5" />
    </g>
  ),
  headband: () => (
    <g>
      <rect x="52" y="64" width="96" height="14" rx="7" fill="#E85D6E" />
      <rect x="52" y="69" width="96" height="4" fill="#FFFFFF" opacity="0.7" />
    </g>
  ),
  earrings: () => (
    <g fill="#F2C14E">
      <circle cx="52" cy="106" r="5" />
      <circle cx="148" cy="106" r="5" />
    </g>
  ),
  necklace: () => (
    <g>
      <path d="M84 148 Q100 166 116 148" stroke="#F2C14E" strokeWidth="4" fill="none" />
      <circle cx="100" cy="164" r="6" fill="#F2C14E" />
    </g>
  ),
  flower: () => (
    <g transform="translate(140 52)">
      <g fill="#E85D6E">
        <circle cx="0" cy="-9" r="7" />
        <circle cx="9" cy="0" r="7" />
        <circle cx="0" cy="9" r="7" />
        <circle cx="-9" cy="0" r="7" />
      </g>
      <circle cx="0" cy="0" r="5" fill="#F2C14E" />
    </g>
  ),
  cap: () => (
    <g>
      <path d="M54 68 Q54 30 100 30 Q146 30 146 68 Z" fill="#4A6FA5" />
      <path d="M146 62 Q176 64 176 76 Q150 76 146 74 Z" fill="#3A5A88" />
    </g>
  ),
};

const FUN: Record<string, JSX.Element | null> = {
  none: null,
  pet: (
    <g transform="translate(150 158)">
      <circle cx="0" cy="0" r="18" fill="#B87C56" />
      <circle cx="-11" cy="-14" r="6" fill="#8D5A3B" />
      <circle cx="11" cy="-14" r="6" fill="#8D5A3B" />
      <circle cx="-6" cy="-2" r="2.6" fill="#2B2B33" />
      <circle cx="6" cy="-2" r="2.6" fill="#2B2B33" />
      <path d="M-5 7 Q0 12 5 7" stroke="#2B2B33" strokeWidth="2.5" fill="none" />
    </g>
  ),
  coffee: (
    <g transform="translate(44 158)">
      <rect x="-14" y="-14" width="28" height="30" rx="4" fill="#FFFFFF" />
      <rect x="-14" y="-14" width="28" height="8" fill="#8D5A3B" />
      <path d="M14 -6 q12 4 0 14" stroke="#FFFFFF" strokeWidth="4" fill="none" />
    </g>
  ),
  guitar: (
    <g transform="translate(44 156) rotate(-20)">
      <circle cx="0" cy="10" r="16" fill="#A9622F" />
      <circle cx="0" cy="10" r="5" fill="#2B2B33" />
      <rect x="-3" y="-30" width="6" height="34" fill="#8D5A3B" />
    </g>
  ),
  book: (
    <g transform="translate(46 162)">
      <rect x="-18" y="-10" width="36" height="24" rx="3" fill="#4A6FA5" />
      <rect x="-2" y="-10" width="4" height="24" fill="#FFFFFF" opacity="0.8" />
    </g>
  ),
  sparkles: (
    <g fill="#F2C14E">
      <path d="M34 46 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" />
      <path d="M168 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" />
      <path d="M172 120 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" />
    </g>
  ),
  balloon: (
    <g transform="translate(160 148)">
      <ellipse cx="0" cy="-20" rx="15" ry="18" fill="#E85D6E" />
      <path d="M0 -2 q6 16 -2 30" stroke="#41414B" strokeWidth="2.5" fill="none" />
    </g>
  ),
};

const AvatarCanvas = ({ layers, drawing, size = 140, className = "", animate = false }: Props) => {
  const l = { ...DEFAULT_AVATAR, ...(layers || {}) };
  const slot = String(l.drawingSlot || "full");

  // Legacy avatars stored the drawing as the whole picture.
  if (drawing && slot === "full") {
    return (
      <img
        src={drawing}
        alt=""
        width={size}
        height={size}
        className={`rounded-2xl bg-white object-contain ${animate ? "animate-scale-in" : ""} ${className}`}
      />
    );
  }

  const skin = colorFor("skin", l.skin) || "#F7C7A3";
  const hair = colorFor("hairColor", l.hairColor) || "#2B2B33";
  const cloth = colorFor("clothesColor", l.clothesColor) || "#2ECC8F";
  const aura = colorFor("aura", l.aura);

  const clothes = (CLOTHES[l.clothes] || CLOTHES.tee)(cloth, skin);
  const hairShape = (HAIR_SHAPES[l.hair] || HAIR_SHAPES.short)(hair);
  const facial = (FACIAL[l.facialHair] || FACIAL.none)(hair);
  const accessory = (ACCESSORY[l.accessory] || ACCESSORY.none)(hair);
  const box = DRAWING_SLOT_BOXES[slot];

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`${animate ? "animate-scale-in" : ""} ${className}`}
      role="img"
      aria-hidden="true"
    >
      <clipPath id="avatar-frame">
        <rect x="0" y="0" width="200" height="200" rx="24" />
      </clipPath>
      <g clipPath="url(#avatar-frame)">
        <rect x="0" y="0" width="200" height="200" fill={aura || "#FAFAFA"} />
        {drawing && box && slot === "background" && (
          <image href={drawing} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" />
        )}
        {clothes}
        <rect x="88" y="118" width="24" height="32" fill={skin} />
        <circle cx="52" cy="100" r="12" fill={skin} />
        <circle cx="148" cy="100" r="12" fill={skin} />
        <rect x="56" y="46" width="88" height="92" rx="32" fill={skin} />
        {facial}
        {hairShape}
        {EYES[l.eyes] || EYES.dots}
        {MOUTHS[l.mouth] || MOUTHS.smile}
        {GLASSES[l.glasses] || null}
        {accessory}
        {FUN[l.fun] || null}
        {drawing && box && slot !== "background" && (
          <image href={drawing} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" />
        )}
      </g>
    </svg>
  );
};


export default AvatarCanvas;
