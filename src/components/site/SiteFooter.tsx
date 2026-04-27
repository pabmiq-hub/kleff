import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import logo from "@/assets/kleff-logo.png";
import { useI18n } from "@/i18n/I18nProvider";

export function SiteFooter() {
  const { t, href } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={logo} alt="KLEFF" className="h-12 w-auto rounded-md mb-5" />
          <p className="text-cream/80 max-w-sm leading-relaxed">{t.footer.tagline}</p>
          <div className="flex items-start gap-2 mt-6 text-sm text-cream/70">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-coral" />
            <span>{t.footer.location}</span>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-cream">{t.footer.sections}</h4>
          <ul className="space-y-2 text-cream/75">
            <li>
              <Link to={href("/")} className="hover:text-coral transition-colors">
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link to={href("/about")} className="hover:text-coral transition-colors">
                {t.nav.about}
              </Link>
            </li>
            <li>
              <Link to={href("/blog")} className="hover:text-coral transition-colors">
                {t.nav.blog}
              </Link>
            </li>
            <li>
              <Link to={href("/contact")} className="hover:text-coral transition-colors">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-cream">{t.footer.follow}</h4>
          <ul className="space-y-3 text-cream/75">
            <li>
              <a
                href="https://www.instagram.com/kleff.bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-coral transition-colors"
              >
                <Instagram className="h-4 w-4" /> @kleff.bcn
              </a>
            </li>
            <li>
              <a
                href="https://www.meetup.com/es-es/kleff-bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-coral transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Meetup
              </a>
            </li>
            <li>
              <a
                href="mailto:hola@kleff.es"
                className="inline-flex items-center gap-2 hover:text-coral transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>hola@kleff.es</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-cream/50 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {year} KLEFF. {t.footer.rights}</span>
          <span>Made with 🎲 in Barcelona</span>
        </div>
      </div>
    </footer>
  );
}
