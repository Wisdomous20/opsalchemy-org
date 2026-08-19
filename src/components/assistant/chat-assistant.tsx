"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { VoiceAssistant } from "./voice-assistant";

interface Citation {
  readonly sourceId: string;
  readonly title: string;
  readonly excerpt: string;
}

interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly citations?: readonly Citation[];
}

interface StoredConversation {
  readonly conversationId: string;
  readonly messages: readonly ChatMessage[];
}

const STORAGE_KEY = "opsalchemy-assistant-v1";
const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello—I’m the OPSAlchemy guide. Tell me what feels harder than it should in your business, and I’ll help you find a clearer starting point.",
};

const SUGGESTIONS = [
  "Which service could help my growing team?",
  "How does transaction management work?",
  "Our follow-up process is inconsistent.",
] as const;

function newConversation(): StoredConversation {
  return { conversationId: crypto.randomUUID(), messages: [WELCOME_MESSAGE] };
}

function isStoredConversation(value: unknown): value is StoredConversation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredConversation>;
  return (
    typeof candidate.conversationId === "string" &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(
      (message) =>
        message &&
        typeof message.id === "string" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
  );
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<StoredConversation | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : null;
        setConversation(isStoredConversation(parsed) ? parsed : newConversation());
      } catch {
        setConversation(newConversation());
      }
    }, 0);

    return () => window.clearTimeout(initialize);
  }, []);

  useEffect(() => {
    if (!conversation) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAssistant();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#assistant") setIsOpen(true);
    };

    const openFromTrigger = () => setIsOpen(true);

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("opsalchemy:open-assistant", openFromTrigger);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("opsalchemy:open-assistant", openFromTrigger);
    };
  }, []);

  function closeAssistant() {
    setIsOpen(false);
    if (window.location.hash === "#assistant") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }

  async function sendMessage(message: string) {
    const content = message.trim();
    if (!conversation || !content || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const previousMessages = conversation.messages;

    setConversation({ ...conversation, messages: [...previousMessages, userMessage] });
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.conversationId,
          message: content,
          history: previousMessages
            .filter((item) => item.id !== "welcome")
            .slice(-12)
            .map(({ role, content: priorContent }) => ({
              role,
              content: priorContent,
            })),
        }),
      });

      const payload: unknown = await response.json();
      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        !("answer" in payload) ||
        typeof payload.answer !== "string"
      ) {
        throw new Error(response.status === 429 ? "rate_limited" : "request_failed");
      }

      const citations =
        "citations" in payload && Array.isArray(payload.citations)
          ? (payload.citations as Citation[])
          : [];
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.answer,
        citations,
      };
      setConversation((current) =>
        current
          ? { ...current, messages: [...current.messages, assistantMessage] }
          : current,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error && requestError.message === "rate_limited"
          ? "You’ve reached the short-term message limit. Please wait a minute and try again."
          : "I couldn’t reach the knowledge service. Please try again or contact Rhiannon directly.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function resetConversation() {
    const reset = newConversation();
    setConversation(reset);
    setDraft("");
    setError(null);
  }

  return (
    <div className={`chat-assistant ${isOpen ? "chat-assistant--open" : ""}`}>
      {isOpen && (
        <section className="chat-panel" role="dialog" aria-label="OPSAlchemy assistant">
          <header className="chat-panel__header">
            <div className="chat-panel__identity">
              <span className="chat-panel__sigil" aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>OPSAlchemy Guide</strong>
                <span>
                  <i aria-hidden="true" /> Grounded in approved business knowledge
                </span>
              </div>
            </div>
            <div className="chat-panel__controls">
              <button
                type="button"
                onClick={resetConversation}
                aria-label="Start a new conversation"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={closeAssistant}
                aria-label="Close assistant"
              >
                ×
              </button>
            </div>
          </header>

          <div className="chat-transcript" ref={transcriptRef} aria-live="polite">
            {conversation && (
              <VoiceAssistant
                conversationId={conversation.conversationId}
                onTextFallback={() => inputRef.current?.focus()}
              />
            )}

            {conversation?.messages.map((message) => (
              <article
                className={`chat-message chat-message--${message.role}`}
                key={message.id}
              >
                <span className="chat-message__role">
                  {message.role === "assistant" ? "Guide" : "You"}
                </span>
                <p>{message.content}</p>
                {message.citations && message.citations.length > 0 && (
                  <details className="chat-sources">
                    <summary>
                      {message.citations.length} verified source
                      {message.citations.length === 1 ? "" : "s"}
                    </summary>
                    <ol>
                      {message.citations.map((citation) => (
                        <li key={citation.sourceId}>
                          <strong>{citation.title}</strong>
                          <span>{citation.excerpt}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </article>
            ))}

            {conversation?.messages.length === 1 && (
              <div className="chat-suggestions" aria-label="Suggested questions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isSending && (
              <div className="chat-thinking" aria-label="The assistant is thinking">
                <span />
                <span />
                <span />
              </div>
            )}

            {error && (
              <div className="chat-error" role="alert">
                <p>{error}</p>
                <a href="mailto:rhiannon@opsalchemy.org?subject=OPSAlchemy%20consultation">
                  Contact Rhiannon ↗
                </a>
              </div>
            )}
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <label htmlFor="assistant-message">Ask about your operations</label>
            <div>
              <textarea
                id="assistant-message"
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 2_000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="What feels harder than it should?"
                rows={2}
                maxLength={2_000}
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSending}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
            <p>
              History is saved in this browser; messages are processed by OpenAI. Don’t
              share sensitive information.{" "}
              <a href="mailto:rhiannon@opsalchemy.org?subject=OPSAlchemy%20consultation">
                Prefer a person?
              </a>
            </p>
          </form>
        </section>
      )}

      <button
        className="chat-launcher"
        type="button"
        onClick={() => (isOpen ? closeAssistant() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close OPSAlchemy assistant" : "Open OPSAlchemy assistant"}
      >
        <span aria-hidden="true">{isOpen ? "×" : "✦"}</span>
        <strong>{isOpen ? "Close" : "Ask OPSAlchemy"}</strong>
      </button>
    </div>
  );
}
