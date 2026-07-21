import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useConversationOptional } from "../../contexts/ConversationProvider";
import { useUserProgress } from "../../hooks/useUserProgress";
import {
  getConversationBarDebugInfo,
  shouldShowConversationBar,
} from "../../lib/navigation/conversationAccess";
import { Button } from "../ui/Button";

export type ConversationBarStatus = "loading" | "ready" | "error" | "disabled";

const QUICK_EXAMPLES = [
  "Je suis en vacances du 10 au 18 août",
  "Je travaille demain",
  "Je veux courir 30 minutes demain",
  "Je veux prier ce soir",
  "J'ai un rendez-vous demain à 14 h",
] as const;

export function ConversationHeaderTrigger() {
  const { user } = useAuth();
  const { loading: progressLoading } = useUserProgress();
  const location = useLocation();
  const conversation = useConversationOptional();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(user);
  const showTrigger = shouldShowConversationBar({
    isAuthenticated,
    pathname: location.pathname,
    progressLoading,
  });

  const status: ConversationBarStatus = progressLoading
    ? "loading"
    : !conversation
      ? "disabled"
      : conversation.error || localError
        ? "error"
        : "ready";

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.state.messages, open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (import.meta.env.DEV && showTrigger) {
      const debug = getConversationBarDebugInfo({
        isAuthenticated,
        pathname: location.pathname,
        progressLoading,
        conversationAvailable: Boolean(conversation),
        rendered: true,
        status,
      });
      console.info("[ConversationBar debug]", debug);
    }
  }, [
    showTrigger,
    isAuthenticated,
    location.pathname,
    progressLoading,
    conversation,
    status,
  ]);

  if (!showTrigger) {
    return null;
  }

  const recentMessages = conversation?.state.messages.slice(-8) ?? [];
  const sending = conversation?.sending ?? false;
  const errorMessage =
    localError ??
    conversation?.error ??
    (status === "disabled" ? "Assistant indisponible — réessayer" : null);

  async function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversation) return;

    setInput("");
    setOpen(true);
    setLocalError(null);

    try {
      await conversation.sendMessage(trimmed);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Assistant indisponible — réessayer",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await submitText(input);
  }

  const inputDisabled = status === "loading" || status === "disabled" || sending;

  return (
    <div
      ref={rootRef}
      className={`conversation-header-trigger conversation-header-trigger-${status}${open ? " conversation-header-trigger-open" : ""}`}
      data-conversation-status={status}
    >
      <button
        type="button"
        className="conversation-header-trigger-button"
        aria-expanded={open}
        aria-controls="conversation-header-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="conversation-header-trigger-icon" aria-hidden="true">
          ◎
        </span>
        <span className="conversation-header-trigger-label">
          Parler à Aura
        </span>
      </button>

      {open && (
        <div
          id="conversation-header-panel"
          className="conversation-header-panel"
          role="dialog"
          aria-label="Conversation avec Aura"
        >
          <header className="conversation-header-panel-header">
            <strong>Aura</strong>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
          </header>

          <div className="conversation-header-panel-messages">
            {errorMessage && (
              <p className="floating-conversation-error">{errorMessage}</p>
            )}

            {recentMessages.length === 0 && !errorMessage && (
              <>
                <p className="floating-conversation-help">
                  Dis-moi ce que tu veux modifier : travail, vacances, sport,
                  rendez-vous…
                </p>
                <div className="floating-conversation-examples">
                  {QUICK_EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="floating-conversation-example-chip"
                      disabled={inputDisabled}
                      onClick={() => void submitText(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </>
            )}

            {recentMessages.map((message) => (
              <div
                key={message.id}
                className={`floating-conversation-message floating-conversation-message-${message.role}`}
              >
                {message.text.split("\n").map((line, index) => (
                  <p key={`${message.id}-${index}`}>{line}</p>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="conversation-header-panel-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="floating-conversation-input"
              placeholder="Ex. Je suis en vacances du 10 au 18 août"
              aria-label="Que souhaites-tu modifier ?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={inputDisabled}
            />
            <Button
              type="submit"
              size="sm"
              disabled={inputDisabled || !input.trim()}
            >
              {sending ? "…" : "Envoyer"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

/** @deprecated Utiliser ConversationHeaderTrigger dans le header. */
export function FloatingConversationBar() {
  return null;
}
