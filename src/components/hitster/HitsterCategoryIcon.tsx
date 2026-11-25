import {
  CalendarCheck,
  Crosshair,
  Disc3,
  History,
  Mic2,
  Music,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { HitsterColor, HitsterSide } from "@/lib/hitster";

const CATEGORY_ICONS: Record<HitsterSide, Record<HitsterColor, LucideIcon>> = {
  A: {
    green: Users,
    pink: History,
    yellow: Target,
    purple: Disc3,
    blue: Crosshair,
  },
  B: {
    green: Music,
    pink: CalendarCheck,
    yellow: Mic2,
    purple: Disc3,
    blue: Target,
  },
};

export function HitsterCategoryIcon({
  side,
  color,
  className = "h-4 w-4",
}: {
  side: HitsterSide;
  color: HitsterColor;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[side][color];
  return <Icon className={className} aria-hidden="true" />;
}