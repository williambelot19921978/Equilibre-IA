import { useEffect, useRef } from "react";

import type { ConversationMessage } from "../../ai/conversationFoundation";
import { AssistantMessageBubble } from "./AssistantMessageBubble";

type AssistantMessageListProps = {
  messages: readonly ConversationMessage[];
  loading?: boolean;
  actionLoadingId?: string | null;
  onConfirmAction?: (actionId: string) => void | Promise<unknown>;
  onCancelAction?: (actionId: string) => void | Promise<unknown>;
};

export function AssistantMessageList({
  messages,
  loading = false,
  actionLoadingId = null,
  onConfirmAction,
  onCancelAction,
}: AssistantMessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="assistant-empty-state">
        <p>Bonjour — pose une question sur ton organisation, ton énergie ou tes objectifs.</p>
        <p className="assistant-empty-hint">
          Je propose des actions — tu confirmes avant toute modification.
        </p>
      </div>
    );
  }

  return (
    <div className="assistant-message-list" role="log" aria-live="polite">
      {messages.map((message) => (
        <AssistantMessageBubble
          key={message.id}
          message={message}
          actionLoadingId={actionLoadingId}
          onConfirmAction={onConfirmAction}
          onCancelAction={onCancelAction}
        />
      ))}
      {loading && (
        <p className="assistant-loading" aria-busy="true">
          Réflexion en cours…
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
