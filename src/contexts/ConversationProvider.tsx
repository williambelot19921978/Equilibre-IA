import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createInitialConversationState,
  processConversationTurn,
} from "../ai/nlp/conversationEngine";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { executeNlpActions } from "../services/nlpActionService";
import { loadDailyRoutine } from "../services/dailyRoutineService";
import { getUserTasks } from "../services/tasksService";
import { getChildrenByHousehold } from "../services/childrenService";
import { getCurrentHouseholdId } from "../services/householdService";
import type { ConversationState, NlpDebugInfo } from "../types/nlp";

type ConversationContextValue = {
  state: ConversationState;
  sending: boolean;
  error: string | null;
  lastDebug: NlpDebugInfo | null;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(
  null,
);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ConversationState>(
    createInitialConversationState(),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDebug, setLastDebug] = useState<NlpDebugInfo | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !text.trim() || sending) return;

      setSending(true);
      setError(null);

      try {
        const referenceDate = getCurrentDeviceDate();
        const householdId = await getCurrentHouseholdId(user.id);
        const [tasks, children, routine] = await Promise.all([
          getUserTasks(user.id),
          getChildrenByHousehold(householdId),
          loadDailyRoutine(user.id).catch(() => null),
        ]);

        const result = await processConversationTurn({
          text: text.trim(),
          state,
          runtimeContext: {
            userId: user.id,
            referenceDate,
            childNames: children.map((child) => child.first_name),
            defaultWorkStart: routine?.workStart ?? undefined,
            defaultWorkEnd: routine?.workEnd ?? undefined,
            tasks: tasks.map((task) => ({
              id: task.id,
              title: task.title,
              category: task.category,
              status: task.status,
            })),
          },
          executeActions: async (actions) =>
            executeNlpActions({
              userId: user.id,
              actions,
              referenceDate,
            }),
        });

        setState(result.state);
        setLastDebug(result.debug ?? null);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Assistant indisponible — réessayer";
        setError(message);
        setLastDebug(null);
        throw caught;
      } finally {
        setSending(false);
      }
    },
    [user, state, sending],
  );

  const clearConversation = useCallback(() => {
    setState(createInitialConversationState());
    setError(null);
    setLastDebug(null);
  }, []);

  const value = useMemo(
    () => ({
      state,
      sending,
      error,
      lastDebug,
      sendMessage,
      clearConversation,
    }),
    [state, sending, error, lastDebug, sendMessage, clearConversation],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error("useConversation must be used within ConversationProvider");
  }

  return context;
}

export function useConversationOptional() {
  return useContext(ConversationContext);
}
