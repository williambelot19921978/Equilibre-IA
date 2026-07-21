import type { ConversationMessage } from "../../ai/conversationFoundation";
import type { AssistantResponse } from "../../ai/conversationFoundation";
import { AssistantActionCard } from "./AssistantActionCard";

type AssistantMessageBubbleProps = {
  message: ConversationMessage;
  actionLoadingId?: string | null;
  onConfirmAction?: (actionId: string) => void | Promise<unknown>;
  onCancelAction?: (actionId: string) => void | Promise<unknown>;
};

export function AssistantMessageBubble({
  message,
  actionLoadingId = null,
  onConfirmAction,
  onCancelAction,
}: AssistantMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={
        isUser
          ? "assistant-message assistant-message-user"
          : "assistant-message assistant-message-assistant"
      }
    >
      <p className="assistant-message-role">{isUser ? "Vous" : "Assistant"}</p>
      <p className="assistant-message-content">{message.content}</p>
      {message.response && (
        <AssistantResponseMeta
          response={message.response}
          actionLoadingId={actionLoadingId}
          onConfirmAction={onConfirmAction}
          onCancelAction={onCancelAction}
        />
      )}
    </article>
  );
}

function AssistantResponseMeta({
  response,
  actionLoadingId,
  onConfirmAction,
  onCancelAction,
}: {
  response: AssistantResponse;
  actionLoadingId?: string | null;
  onConfirmAction?: (actionId: string) => void | Promise<unknown>;
  onCancelAction?: (actionId: string) => void | Promise<unknown>;
}) {
  const secureActions = response.proposedActions.filter(
    (action) => action.status !== "not_implemented",
  );

  return (
    <div className="assistant-response-meta">
      <p>
        Intention : <strong>{response.intent}</strong> — confiance{" "}
        {Math.round(response.confidence * 100)} %
      </p>
      {response.warning && (
        <p className="assistant-response-warning">{response.warning}</p>
      )}
      {secureActions.length > 0 && (
        <div className="assistant-action-list">
          {secureActions.map((action) => (
            <AssistantActionCard
              key={action.actionId ?? action.type}
              action={action}
              disabled={Boolean(actionLoadingId)}
              onConfirm={onConfirmAction}
              onCancel={onCancelAction}
            />
          ))}
        </div>
      )}
      {response.explanation.sources.length > 0 && (
        <details className="assistant-response-sources">
          <summary>Pourquoi cette réponse ?</summary>
          <p>{response.explanation.summary}</p>
          <ul>
            {response.explanation.sources.map((source) => (
              <li key={source.id}>
                {source.label} {source.available ? "" : "(indisponible)"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
