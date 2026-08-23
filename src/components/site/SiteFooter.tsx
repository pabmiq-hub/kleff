import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import logoAsset from "@/assets/kleff-logo-white.png.asset.json";
const logo = logoAsset.url;
import { useI18n } from "@/i18n/I18nProvider";
import { openCookieSettings } from "@/components/site/CookieConsent";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

export function SiteFooter() {
  const { t, href } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-cream relative overflow-hidden border-t-4 border-coral">
      {/* Decorative coral square */}
      <div className="absolute top-12 right-12 size-12 bg-coral rounded-2xl hidden md:block" />
      <div className="absolute bottom-32 left-20 size-8 bg-coral/40 rounded-full hidden md:block" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-4 relative">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-12 bg-coral rounded-xl border-2 border-cream/20 flex items-center justify-center overflow-hidden">
              <img width={32} height={32} loading="lazy" decoding="async" src={getOptimizedImageUrl(logo, { width: 64, height: 64 })} alt="KLEFF" className="h-8 w-8 object-contain" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">KLEFF</span>
          </div>
          <p className="text-cream/80 max-w-sm leading-relaxed text-lg">{t.footer.tagline}</p>
          <div className="flex items-start gap-2 mt-6 text-sm text-cream/70">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-coral" />
            <span>{t.footer.location}</span>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-5 text-cream uppercase tracking-wider">
            {t.footer.sections}
          </h4>
          <ul className="space-y-3 text-cream/75">
            <li>
              <Link to={href("/")} className="hover:text-coral transition-colors font-medium">
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link to={href("/about")} className="hover:text-coral transition-colors font-medium">
                {t.nav.about}
              </Link>
            </li>
            <li>
              <Link to={href("/how-it-works")} className="hover:text-coral transition-colors font-medium">
                {t.nav.how}
              </Link>
            </li>
            <li>
              <Link to={href("/media")} className="hover:text-coral transition-colors font-medium">
                {t.nav.media}
              </Link>
            </li>
            <li>
              <Link to={href("/blog")} className="hover:text-coral transition-colors font-medium">
                {t.nav.blog}
              </Link>
            </li>
            <li>
              <Link to={href("/contact")} className="hover:text-coral transition-colors font-medium">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-5 text-cream uppercase tracking-wider">
            {t.footer.follow}
          </h4>
          <ul className="space-y-3 text-cream/75">
            <li>
              <a
                href="https://www.instagram.com/kleff.bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-coral transition-colors font-medium"
              >
                <Instagram className="h-4 w-4" />
                <span>@kleff.bcn</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.meetup.com/es-es/kleff-bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-coral transition-colors font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Meetup</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:hola@kleff.es"
                className="inline-flex items-center gap-2 hover:text-coral transition-colors font-medium"
              >
                <Mail className="h-4 w-4" />
                <span>hola@kleff.es</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-3 text-xs text-cream/60">
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
            <Link to={href("/legal-notice")} className="hover:text-coral transition-colors">
              {t.footer.legalNotice}
            </Link>
            <Link to={href("/privacy")} className="hover:text-coral transition-colors">
              {t.footer.privacy}
            </Link>
            <Link to={href("/cookies")} className="hover:text-coral transition-colors">
              {t.footer.cookies}
            </Link>
            <Link to={href("/terms")} className="hover:text-coral transition-colors">
              {t.footer.terms}
            </Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-coral transition-colors cursor-pointer"
            >
              {t.footer.cookieSettings}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-between font-mono uppercase tracking-wider text-cream/50">
            <span>© {year} KLEFF · {t.footer.rights}</span>
            <span>Made with 🎲 in Barcelona</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
