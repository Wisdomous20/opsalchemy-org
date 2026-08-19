import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How OPSAlchemy handles information shared through this website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-page__header">
        <SiteHeader />
      </div>
      <article className="shell legal-copy">
        <p className="eyebrow">Privacy</p>
        <h1>Your information should be handled with care.</h1>
        <p className="legal-copy__updated">Last updated August 19, 2026</p>
        <h2>Information you choose to share</h2>
        <p>
          When you contact OPSAlchemy by email, we receive the information you include
          in your message, such as your name, email address, business information, and
          the details of your inquiry. We use that information to respond to you and
          discuss relevant services.
        </p>
        <h2>Website data</h2>
        <p>
          This version of the website does not use optional analytics or marketing
          cookies. Our hosting provider may process limited technical information needed
          to deliver and protect the site, such as IP address, browser type, and request
          logs.
        </p>
        <h2>Sharing and retention</h2>
        <p>
          OPSAlchemy does not sell your personal information. Information may be shared
          with service providers only when needed to operate the business or respond to
          your request, and retained only as long as reasonably necessary for those
          purposes or to meet legal obligations.
        </p>
        <h2>Your choices</h2>
        <p>
          You may ask to access, correct, or delete information you have shared with us,
          subject to applicable legal requirements. You may also ask to stop receiving
          marketing email at any time.
        </p>
        <h2>Contact</h2>
        <p>
          For a privacy question or request, email{" "}
          <a href="mailto:rhiannon@opsalchemy.org">rhiannon@opsalchemy.org</a>.
        </p>
        <Link className="text-link" href="/">
          <span aria-hidden="true">←</span> Return home
        </Link>
      </article>
      <SiteFooter />
    </main>
  );
}
