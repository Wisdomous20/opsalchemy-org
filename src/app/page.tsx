import { AlchemyOrbit } from "@/components/marketing/alchemy-orbit";
import { ChatAssistant } from "@/components/assistant/chat-assistant";
import { AssistantTrigger } from "@/components/assistant/assistant-trigger";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import {
  AUDIENCES,
  COMMON_FRICTION,
  FAQS,
  MARKETING_SERVICES,
  OPERATING_PILLARS,
  TEAM,
} from "@/content/marketing";

export default function Home() {
  return (
    <main>
      <section className="hero" id="top">
        <SiteHeader />
        <div className="hero__grain" aria-hidden="true" />
        <div className="shell hero__grid">
          <div className="hero__content">
            <p className="eyebrow hero__eyebrow">Real estate operations, transformed</p>
            <h1>
              Your business can feel <em>lighter.</em>
            </h1>
            <p className="hero__lede">
              OPSAlchemy turns operational friction into thoughtful systems—so your team
              can work with clarity, your clients feel cared for, and growth stops
              depending on heroic effort.
            </p>
            <div className="hero__actions">
              <AssistantTrigger className="button button--brass">
                Begin the transformation <span aria-hidden="true">↗</span>
              </AssistantTrigger>
              <a className="text-link text-link--light" href="#services">
                Explore our services <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="hero__visual">
            <AlchemyOrbit />
            <p className="hero__aside">
              <span>Operational alchemy</span>
              The deliberate transformation of complexity into a business that moves
              with confidence.
            </p>
          </div>
        </div>
        <div className="shell proof-strip" aria-label="OPSAlchemy experience">
          <p>
            <strong>Nearly a decade</strong>
            <span>in real estate operations</span>
          </p>
          <p>
            <strong>15+ years</strong>
            <span>in real estate and small business</span>
          </p>
          <p>
            <strong>Six connected systems</strong>
            <span>for a steadier business</span>
          </p>
        </div>
      </section>

      <section className="section friction" aria-labelledby="friction-title">
        <div className="shell split-heading">
          <p className="eyebrow">The weight you feel</p>
          <div>
            <h2 id="friction-title">
              Success should not require you to hold <em>everything.</em>
            </h2>
            <p className="section-lede">
              The problem is rarely a lack of effort. It is the invisible operational
              load behind the work—the handoffs, decisions, details, and follow-through
              that still depend on you.
            </p>
          </div>
        </div>
        <div className="shell friction__list">
          {COMMON_FRICTION.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="section services"
        id="services"
        aria-labelledby="services-title"
      >
        <div className="shell section-heading section-heading--services">
          <div>
            <p className="eyebrow">The work</p>
            <h2 id="services-title">Six systems. One steadier business.</h2>
          </div>
          <p>
            Start with the pressure point you can feel today. We will connect it to the
            wider system your business needs tomorrow.
          </p>
        </div>
        <div className="shell service-ledger">
          {MARKETING_SERVICES.map((service) => (
            <article className="service-row" key={service.id} id={service.id}>
              <span className="service-row__number">{service.number}</span>
              <div className="service-row__title">
                <h3>{service.name}</h3>
                <p>{service.outcome}</p>
              </div>
              <div className="service-row__detail">
                <p>{service.summary}</p>
                <span>{service.idealFor}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section audience" aria-labelledby="audience-title">
        <div className="shell audience__grid">
          <div>
            <p className="eyebrow">Who we serve</p>
            <h2 id="audience-title">Built for the moment momentum meets complexity.</h2>
          </div>
          <div className="audience__list">
            {AUDIENCES.map((audience, index) => (
              <article key={audience.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{audience.title}</h3>
                <p>{audience.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section approach"
        id="approach"
        aria-labelledby="approach-title"
      >
        <div className="approach__symbol" aria-hidden="true">
          ✦
        </div>
        <div className="shell split-heading split-heading--dark">
          <p className="eyebrow">Our philosophy</p>
          <div>
            <h2 id="approach-title">
              Operations are where your promises become <em>real.</em>
            </h2>
            <p className="section-lede">
              A resilient business is not built from tools alone. We align the human and
              practical parts of the work so the experience is dependable on both sides
              of the transaction.
            </p>
          </div>
        </div>
        <div className="shell pillars">
          {OPERATING_PILLARS.map((pillar) => (
            <article key={pillar.number}>
              <span>{pillar.number}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section team" id="team" aria-labelledby="team-title">
        <div className="shell section-heading">
          <div>
            <p className="eyebrow">The people behind the process</p>
            <h2 id="team-title">Steady hands. Strategic minds.</h2>
          </div>
          <p>
            Experienced operators who understand the pace of real estate—and the care it
            takes to build a business that can sustain it.
          </p>
        </div>
        <div className="shell team__grid">
          {TEAM.map((person, index) => (
            <article className="person" key={person.name}>
              <div className="person__portrait" aria-hidden="true">
                <span>{person.initials}</span>
                <i>{String(index + 1).padStart(2, "0")}</i>
              </div>
              <div className="person__content">
                <p className="eyebrow">{person.role}</p>
                <h3>{person.name}</h3>
                <p>{person.bio}</p>
                <a className="text-link" href={`mailto:${person.email}`}>
                  {person.email} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq" id="insights" aria-labelledby="faq-title">
        <div className="shell faq__grid">
          <div className="faq__heading">
            <p className="eyebrow">A clearer starting point</p>
            <h2 id="faq-title">Questions, answered.</h2>
            <p>
              Still deciding where to begin? A short conversation can help identify the
              operational pressure point with the greatest leverage.
            </p>
          </div>
          <div className="faq__list">
            {FAQS.map((faq, index) => (
              <details key={faq.question}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {faq.question}
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="closing" aria-labelledby="closing-title">
        <div className="shell closing__grid">
          <p className="eyebrow">Your next chapter</p>
          <div>
            <h2 id="closing-title">
              Make room for the work only <em>you</em> can do.
            </h2>
            <p>
              Tell us what feels heavier than it should. We will help you find the
              system underneath it.
            </p>
            <AssistantTrigger className="button button--dark">
              Start a conversation <span aria-hidden="true">↗</span>
            </AssistantTrigger>
          </div>
          <aside>
            <p className="eyebrow">Occasional field notes</p>
            <h3>Thoughtful ideas for a better-run business.</h3>
            <p>Join the OPSAlchemy mailing list for practical operations insights.</p>
            <a
              className="text-link"
              href="mailto:rhiannon@opsalchemy.org?subject=Join%20the%20OPSAlchemy%20mailing%20list"
            >
              Ask to join the list <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </div>
      </section>

      <SiteFooter />
      <ChatAssistant />
    </main>
  );
}
