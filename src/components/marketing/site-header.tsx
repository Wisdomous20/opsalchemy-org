import Link from "next/link";
import { BrandMark } from "./brand-mark";

const NAVIGATION = [
  { href: "#services", label: "Services" },
  { href: "#approach", label: "Approach" },
  { href: "#team", label: "Team" },
  { href: "#insights", label: "FAQ" },
] as const;

function NavigationLinks() {
  return NAVIGATION.map((item) => (
    <Link key={item.href} href={item.href}>
      {item.label}
    </Link>
  ));
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" aria-label="OPSAlchemy home">
          <BrandMark compact />
        </Link>

        <nav className="site-header__nav" aria-label="Primary navigation">
          <NavigationLinks />
        </nav>

        <a
          className="button button--small button--outline-light site-header__cta"
          href="mailto:rhiannon@opsalchemy.org?subject=OPSAlchemy%20consultation"
        >
          Start a conversation
        </a>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            <NavigationLinks />
            <a href="mailto:rhiannon@opsalchemy.org?subject=OPSAlchemy%20consultation">
              Start a conversation
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
