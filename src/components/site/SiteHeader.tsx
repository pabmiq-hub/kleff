import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import logo from "@/assets/kleff-logo.webp";
import { useI18n, stripLocaleFromPath } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_SHORT, type Locale } from "@/i18n/config";
import { useLocation } from "@tanstack/react-router";

export function SiteHeader() {
  const { t, locale, href, hrefFor } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: t.nav.home, path: "/" },
    { label: t.nav.about, path: "/about" },
    { label: t.nav.how, path: "/how-it-works" },
    { label: t.nav.media, path: "/media" },
    { label: t.nav.blog, path: "/blog" },
    { label: t.nav.contact, path: "/contact" },
  ];

  const logicalPath = stripLocaleFromPath(pathname);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/85 border-b-2 border-ink/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        <Link to={href("/")} className="flex items-center gap-3 group">
          <div className="size-10 bg-coral rounded-xl border-2 border-ink flex items-center justify-center font-display font-bold text-cream shadow-tactile-sm group-hover:scale-105 transition-transform overflow-hidden">
            <img src={logo} alt="" className="h-9 w-9 object-contain" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">KLEFF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={href(item.path)}
              activeOptions={{ exact: item.path === "/" }}
              activeProps={{ className: "text-coral-deep underline decoration-coral decoration-2 underline-offset-4" }}
              className="px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-coral-deep transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher current={locale} buildHref={(l) => hrefFor(logicalPath, l)} />
          <a
            href="https://www.meetup.com/es-es/kleff-bcn/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-coral text-cream border-2 border-ink px-5 py-2.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            {t.nav.join}
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-foreground"
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-cream">
          <nav className="px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={href(item.path)}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.path === "/" }}
                activeProps={{ className: "text-coral-deep bg-primary-soft/40" }}
                className="px-4 py-3 rounded-xl text-base font-medium text-foreground/80 hover:bg-primary-soft/40"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
              <LanguageSwitcher current={locale} buildHref={(l) => hrefFor(logicalPath, l)} />
              <a
                href="https://www.meetup.com/es-es/kleff-bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-coral text-primary-foreground px-5 py-2.5 text-sm font-semibold"
              >
                {t.nav.join}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LanguageSwitcher({
  current,
  buildHref,
}: {
  current: Locale;
  buildHref: (l: Locale) => string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-card border-2 border-ink p-1 shadow-tactile-sm">
      {LOCALES.map((l) => (
        <Link
          key={l}
          to={buildHref(l)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
            current === l
              ? "bg-ink text-cream"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {LOCALE_SHORT[l]}
        </Link>
      ))}
    </div>
  );
}
