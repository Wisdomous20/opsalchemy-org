import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { HomeLink } from "./home-link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <HomeLink>
            <BrandMark />
          </HomeLink>
        </div>
        <div className="site-footer__contact">
          <p className="eyebrow">New business</p>
          <a href="mailto:rhiannon@opsalchemy.org">rhiannon@opsalchemy.org</a>
        </div>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <a
            href="https://www.instagram.com/opsalchemy_/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <span aria-hidden="true">↗</span>
          </a>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
      <div className="shell site-footer__bottom">
        <p>© {new Date().getFullYear()} OPSAlchemy. All rights reserved.</p>
        <p>Operational excellence, by design.</p>
      </div>
    </footer>
  );
}
