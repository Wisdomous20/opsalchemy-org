import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/marketing/brand-mark";
import { LeadsDashboard } from "./leads-dashboard";
import styles from "./leads.module.css";

export const metadata: Metadata = {
  title: "Lead Ledger",
  description: "A working view of OPSAlchemy consultation leads.",
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={`shell ${styles.headerInner}`}>
          <Link href="/" aria-label="Return to OPSAlchemy home">
            <BrandMark compact />
          </Link>
          <div className={styles.environment}>
            <span aria-hidden="true" /> Demo workspace
          </div>
        </div>
      </header>

      <div className={`shell ${styles.intro}`}>
        <div>
          <p className="eyebrow">Relationship intelligence</p>
          <h1>
            Lead <em>ledger.</em>
          </h1>
        </div>
        <p>
          A living view of the people who have raised their hand, the work they need,
          and the context behind each conversation.
        </p>
      </div>

      <LeadsDashboard />

      <footer className={`shell ${styles.footer}`}>
        <span>OPSAlchemy / Lead ledger</span>
        <Link href="/">Return to the website</Link>
      </footer>
    </main>
  );
}
