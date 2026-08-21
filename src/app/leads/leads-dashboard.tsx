"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SERVICE_OFFERINGS } from "@/domain/services/service-offering";
import styles from "./leads.module.css";

interface LeadDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly serviceInterests: readonly string[];
  readonly conversationSummary: string;
  readonly contactAllowed: boolean;
  readonly crmSyncAllowed: boolean;
  readonly consentRecordedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LeadsResponse {
  readonly leads: readonly LeadDto[];
}

const serviceNames = new Map<string, string>(
  SERVICE_OFFERINGS.map((service) => [service.id, service.name]),
);

const unavailableMessage =
  "We could not reach the lead ledger. Check the database connection and try again.";

async function requestLeads(signal?: AbortSignal): Promise<readonly LeadDto[]> {
  const response = await fetch("/api/leads", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) throw new Error("Lead request failed");

  const data = (await response.json()) as LeadsResponse;
  return data.leads;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function LeadInterests({ interests }: { interests: readonly string[] }) {
  if (interests.length === 0) {
    return <span className={styles.muted}>Not specified</span>;
  }

  return (
    <div className={styles.tags}>
      {interests.map((interest) => (
        <span key={interest}>{serviceNames.get(interest) ?? interest}</span>
      ))}
    </div>
  );
}

function LeadRecord({ lead, index }: { lead: LeadDto; index: number }) {
  return (
    <article className={styles.record}>
      <div className={styles.recordNumber} aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className={styles.contact}>
        <h2>{lead.name}</h2>
        <a href={`mailto:${lead.email}`}>{lead.email}</a>
        {lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : null}
      </div>

      <div className={styles.interests}>
        <span className={styles.fieldLabel}>Interested in</span>
        <LeadInterests interests={lead.serviceInterests} />
      </div>

      <div className={styles.recordMeta}>
        <span className={styles.fieldLabel}>Received</span>
        <time dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
        <span
          className={lead.contactAllowed ? styles.consentYes : styles.consentNo}
          title={`Consent recorded ${formatDate(lead.consentRecordedAt)}`}
        >
          {lead.contactAllowed ? "Contact consent" : "No contact consent"}
        </span>
      </div>

      <details className={styles.notes}>
        <summary>
          Conversation notes <span aria-hidden="true">+</span>
        </summary>
        <p>{lead.conversationSummary || "No conversation notes recorded."}</p>
      </details>
    </article>
  );
}

function LoadingState() {
  return (
    <div className={styles.loading} aria-label="Loading leads" aria-live="polite">
      {[0, 1, 2].map((item) => (
        <div key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function LeadsDashboard() {
  const [leads, setLeads] = useState<readonly LeadDto[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const refreshLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setLeads(await requestLeads());
      setRefreshedAt(new Date());
    } catch {
      setError(unavailableMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialLeads() {
      try {
        setLeads(await requestLeads(controller.signal));
        setRefreshedAt(new Date());
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setError(unavailableMessage);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadInitialLeads();
    return () => controller.abort();
  }, []);

  const visibleLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return leads;

    return leads.filter((lead) =>
      [
        lead.name,
        lead.email,
        lead.phone ?? "",
        lead.conversationSummary,
        ...lead.serviceInterests.map(
          (interest) => serviceNames.get(interest) ?? interest,
        ),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [leads, query]);

  return (
    <section className={`shell ${styles.workspace}`} aria-labelledby="ledger-title">
      <div className={styles.toolbar}>
        <div>
          <span className={styles.fieldLabel} id="ledger-title">
            Current records
          </span>
          <strong>{loading ? "—" : leads.length}</strong>
        </div>

        <label className={styles.search}>
          <span className="sr-only">Search leads</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, or service"
          />
        </label>

        <div className={styles.refreshGroup}>
          <span aria-live="polite">
            {refreshedAt
              ? `Updated ${refreshedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "Waiting for data"}
          </span>
          <button type="button" onClick={() => void refreshLeads()} disabled={loading}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M6.1 8.5A7 7 0 0 1 18.7 7M17.9 15.5A7 7 0 0 1 5.3 17" />
            </svg>
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {loading && leads.length === 0 ? <LoadingState /> : null}

      {error ? (
        <div className={styles.errorState} role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <h2>The ledger is unavailable.</h2>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => void refreshLeads()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && leads.length === 0 ? (
        <div className={styles.emptyState}>
          <span aria-hidden="true">◇</span>
          <h2>No leads have arrived yet.</h2>
          <p>New consultation leads will appear here as soon as they are captured.</p>
        </div>
      ) : null}

      {!error && leads.length > 0 ? (
        <div className={styles.ledger} aria-live="polite">
          <div className={styles.ledgerHeader} aria-hidden="true">
            <span>Record</span>
            <span>Contact</span>
            <span>Interest</span>
            <span>Status</span>
            <span>Context</span>
          </div>
          {visibleLeads.map((lead, index) => (
            <LeadRecord key={lead.id} lead={lead} index={index} />
          ))}
          {visibleLeads.length === 0 ? (
            <div className={styles.noResults}>
              No records match “{query}”. Try a broader search.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
