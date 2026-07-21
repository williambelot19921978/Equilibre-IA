import { useCallback, useEffect, useMemo, useState } from "react";

import {
  assistantConversationEngine,
  clearActiveConversation,
  loadConversationStore,
  type ActiveConversation,
  type AssistantResponse,
} from "../ai/conversationFoundation";
import { isAssistantIaEnabled, isSecureActionEngineEnabled } from "../config/featureFlags";

export function useAssistantConversation(
  userId: string | undefined,
  firstName: string,
) {
  const enabled = isAssistantIaEnabled() && Boolean(userId);
  const secureActionsEnabled = isSecureActionEngineEnabled();
  const [conversation, setConversation] = useState<ActiveConversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setConversation(null);
      return;
    }

    const store = loadConversationStore(userId);
    setConversation(store.active);
  }, [enabled, userId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!enabled || !userId) return null;
      const trimmed = message.trim();
      if (!trimmed) return null;

      setLoading(true);
      setError(null);

      try {
        const result = await assistantConversationEngine.processMessage({
          userId,
          firstName,
          message: trimmed,
        });
        setConversation(result.conversation);
        setLastResponse(result.response);
        return result;
      } catch (cause) {
        const messageText =
          cause instanceof Error ? cause.message : "Erreur conversation.";
        setError(messageText);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [enabled, firstName, userId],
  );

  const confirmAction = useCallback(
    async (actionId: string) => {
      if (!enabled || !userId || !secureActionsEnabled) return null;
      setActionLoadingId(actionId);
      setError(null);
      try {
        const result = await assistantConversationEngine.confirmAction(userId, actionId);
        setConversation(result.conversation);
        return result;
      } catch (cause) {
        const messageText =
          cause instanceof Error ? cause.message : "Erreur lors de la confirmation.";
        setError(messageText);
        return null;
      } finally {
        setActionLoadingId(null);
      }
    },
    [enabled, secureActionsEnabled, userId],
  );

  const cancelAction = useCallback(
    async (actionId: string) => {
      if (!enabled || !userId || !secureActionsEnabled) return null;
      setActionLoadingId(actionId);
      setError(null);
      try {
        const result = assistantConversationEngine.cancelAction(userId, actionId);
        setConversation(result.conversation);
        return result;
      } catch (cause) {
        const messageText =
          cause instanceof Error ? cause.message : "Erreur lors de l'annulation.";
        setError(messageText);
        return null;
      } finally {
        setActionLoadingId(null);
      }
    },
    [enabled, secureActionsEnabled, userId],
  );

  const resetConversation = useCallback(() => {
    if (!userId) return;
    const cleared = clearActiveConversation(userId);
    setConversation(cleared.active);
    setLastResponse(null);
    setError(null);
  }, [userId]);

  const messageCount = useMemo(
    () => conversation?.messages.length ?? 0,
    [conversation?.messages.length],
  );

  return {
    enabled,
    secureActionsEnabled,
    conversation,
    loading,
    actionLoadingId,
    error,
    lastResponse,
    messageCount,
    sendMessage,
    confirmAction,
    cancelAction,
    resetConversation,
  };
}
