import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  /** Rutas que activan este elemento (agrupan varias páginas). */
  match?: string[];
  exact?: boolean;
  show: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Pestañas que unifican páginas afines bajo un único elemento del menú. */
export const TAB_GROUPS: { to: string; label: string; superOnly?: boolean; perm?: string }[][] = [
  [
    { to: "/admin/members", label: "Socios", superOnly: true },
    { to: "/admin/invitations", label: "Invitaciones", superOnly: true },
  ],
  [
    { to: "/admin/content", label: "Páginas", superOnly: true },
    { to: "/admin/blog", label: "Blog", perm: "blog" },
    { to: "/admin/media", label: "Medios", superOnly: true },
    { to: "/admin/team", label: "Equipo", superOnly: true },
  ],
  [
    { to: "/admin/polls", label: "Votaciones", superOnly: true },
    { to: "/admin/karma", label: "Karma", superOnly: true },
  ],
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to || pathname === item.to + "/";
  const paths = item.match ?? [item.to];
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AdminNavGroups({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-4">
      {groups.map((g) => {
        const items = g.items.filter((i) => i.show);
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-ink/40">{g.title}</p>
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(pathname, item) ? "bg-coral text-ink" : "text-ink/80 hover:bg-ink/10"
                }`}
              >
                {item.icon} <span>{item.label}</span>
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminSectionTabs({ isSuperAdmin, can }: { isSuperAdmin: boolean; can: (r: string) => boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const group = TAB_GROUPS.find((g) => g.some((t) => pathname === t.to || pathname.startsWith(t.to + "/")));
  if (!group) return null;
  const tabs = group.filter((t) => (t.superOnly ? isSuperAdmin : t.perm ? isSuperAdmin || can(t.perm) : true));
  if (tabs.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-1 border-b border-ink/15 mb-6">
      {tabs.map((t) => {
        const active = pathname === t.to || pathname.startsWith(t.to + "/");
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              active ? "border-coral text-ink" : "border-transparent text-ink/60 hover:text-ink hover:border-ink/30"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
