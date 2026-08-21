import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/marketing/brand-mark";
import { LeadsDashboard } from "./leads-dashboard";
import styles from "./leads.module.css";

export const metadata: Metadata = {
  title: "Leads",
  description: "OPSAlchemy consultation leads.",
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={`shell ${styles.headerInner}`}>
          <Link href="/" aria-label="Return to OPSAlchemy home">
            <BrandMark compact tone="dark" />
          </Link>
          <div className={styles.headerActions}>
            <span className={styles.environment}>Demo workspace</span>
            <Link href="/">Back to website</Link>
          </div>
        </div>
      </header>

      <div className={`shell ${styles.intro}`}>
        <h1>Leads</h1>
        <p>Consultation requests and conversation details.</p>
      </div>

      <LeadsDashboard />
    </main>
  );
}
