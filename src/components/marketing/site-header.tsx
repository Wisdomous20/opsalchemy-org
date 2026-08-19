import Link from "next/link";
import { AssistantTrigger } from "@/components/assistant/assistant-trigger";
import { BrandMark } from "./brand-mark";
import { HomeLink } from "./home-link";

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
        <HomeLink>
          <BrandMark compact />
        </HomeLink>

        <nav className="site-header__nav" aria-label="Primary navigation">
          <NavigationLinks />
        </nav>

        <AssistantTrigger className="button button--small button--outline-light site-header__cta">
          Start a conversation
        </AssistantTrigger>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            <NavigationLinks />
            <AssistantTrigger>Start a conversation</AssistantTrigger>
          </nav>
        </details>
      </div>
    </header>
  );
}
