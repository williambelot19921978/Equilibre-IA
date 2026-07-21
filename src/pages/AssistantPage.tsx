import { Navigate } from "react-router-dom";

import { AssistantComposer } from "../components/assistant/AssistantComposer";
import { AssistantMessageList } from "../components/assistant/AssistantMessageList";
import { Button } from "../components/ui/Button";
import { isAssistantIaEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { useAssistantConversation } from "../hooks/useAssistantConversation";
import { AppRoutes } from "../lib/navigation/routes";

export function AssistantPage() {
  useAppPageTitle("Assistant IA");

  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Utilisateur";

  const {
    enabled,
    secureActionsEnabled,
    conversation,
    loading,
    actionLoadingId,
    error,
    sendMessage,
    confirmAction,
    cancelAction,
    resetConversation,
  } = useAssistantConversation(user?.id, firstName);

  if (!isAssistantIaEnabled()) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  if (!enabled || !user) {
    return (
      <main className="dashboard-page assistant-page">
        <section className="dashboard-container">
          <p>Connecte-toi pour utiliser l&apos;assistant.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page assistant-page">
      <section className="dashboard-container assistant-page-layout">
        <header className="assistant-page-header">
          <div>
            <p className="ds-label">Assistant IA</p>
            <h1 data-testid="assistant-page-title">Parler à Aura</h1>
            <p className="assistant-page-subtitle">
              {secureActionsEnabled
                ? "Je comprends ton contexte et je propose des actions — tu confirmes avant toute modification."
                : "Je comprends ton contexte, j'explique et je conseille — sans modifier tes données pour l'instant."}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={resetConversation}>
            Nouvelle conversation
          </Button>
        </header>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="assistant-chat-panel">
          <AssistantMessageList
            messages={conversation?.messages ?? []}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onConfirmAction={confirmAction}
            onCancelAction={cancelAction}
          />
        </div>

        <AssistantComposer disabled={loading} onSend={sendMessage} />
      </section>
    </main>
  );
}
