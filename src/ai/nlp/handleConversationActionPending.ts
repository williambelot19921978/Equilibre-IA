import {
  createReschedulePendingAction,
  isConversationActionCancellationPhrase,
  isConversationActionConfirmationPhrase,
  RESCHEDULE_CONFIRMATION_PROMPT,
  type ConversationActionPending,
} from "../../lib/nlp/conversationActionPending";
import {
  listDeferrableTasksForDay,
  rescheduleNonUrgentTasks,
} from "../../services/rescheduleNonUrgentTasksService";
import type {
  ConversationMessage,
  ConversationState,
  ConversationTurnResult,
  NlpAction,
  NlpRuntimeContext,
} from "../../types/nlp";
import { createFamilyContextPeriod } from "../../services/familyContextService";
import { dispatchPlanRefresh } from "../../lib/planning/planRefreshEvents";

type MessageFactory = (
  role: "user" | "assistant" | "system",
  text: string,
) => ConversationMessage;

type AppendMessageFn = (
  state: ConversationState,
  message: ConversationMessage,
) => ConversationState;

export async function buildFatigueRescheduleProposal({
  userId,
  date,
}: {
  userId: string;
  date: string;
}): Promise<{
  pending: ConversationActionPending;
  prompt: string;
}> {
  const candidates = await listDeferrableTasksForDay({ userId, date });

  const pending = createReschedulePendingAction({
    date,
    taskIds: candidates.map((candidate) => candidate.taskId).filter(Boolean) as string[],
    calendarItemIds: candidates.map((candidate) => candidate.calendarItemId),
    titles: candidates.map((candidate) => candidate.title),
  });

  return {
    pending,
    prompt: RESCHEDULE_CONFIRMATION_PROMPT,
  };
}

export async function executeReschedulePendingAction({
  pending,
  userId,
}: {
  pending: ConversationActionPending;
  userId: string;
}): Promise<{ summary: string; replanDates: string[] }> {
  const date = pending.date;

  await createFamilyContextPeriod({
    userId,
    period: {
      contextType: "other",
      title: "Journée allégée — fatigue",
      startsAt: `${date}T00:00:00.000Z`,
      endsAt: `${date}T23:59:59.999Z`,
      userId,
      impact: {
        maxFillRatio: 0.4,
        onlyMicroTasks: true,
        reducePersonalTasks: true,
      },
    },
  });

  const result = await rescheduleNonUrgentTasks({
    userId,
    date,
    calendarItemIds: pending.proposedCalendarItemIds,
  });

  const replanDates = [
    date,
    ...result.moved.map((move) => move.toDate),
  ];

  return {
    summary: result.summary,
    replanDates: [...new Set(replanDates)],
  };
}

export async function handleConversationActionPending({
  text,
  state,
  runtimeContext,
  appendMessage,
  createMessage,
}: {
  text: string;
  state: ConversationState;
  runtimeContext: NlpRuntimeContext;
  appendMessage: AppendMessageFn;
  createMessage: MessageFactory;
}): Promise<ConversationTurnResult | null> {
  const pendingState = state.pending;
  if (pendingState?.kind !== "conversation_action") return null;

  const pending = pendingState.action;

  if (isConversationActionCancellationPhrase(text)) {
    const assistantMessage = "D'accord, je laisse ton planning tel quel.";
    const nextState = appendMessage(
      { ...state, pending: undefined },
      createMessage("assistant", assistantMessage),
    );
    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage,
      explanation: ["conversation_action_cancelled"],
    };
  }

  if (!isConversationActionConfirmationPhrase(text)) {
    const assistantMessage =
      "Réponds « oui » ou « décale » pour confirmer, ou « non » pour annuler.";
    const nextState = appendMessage(
      state,
      createMessage("assistant", assistantMessage),
    );
    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage,
      explanation: ["conversation_action_unclear"],
    };
  }

  if (pending.type === "reschedule_non_urgent_tasks") {
    const execution = await executeReschedulePendingAction({
      pending,
      userId: runtimeContext.userId,
    });

    const assistantMessage = execution.summary;
    dispatchPlanRefresh(execution.replanDates);
    const nextState = appendMessage(
      { ...state, pending: undefined },
      createMessage("assistant", assistantMessage),
    );

    const actionsExecuted: NlpAction[] = [
      {
        type: "RescheduleNonUrgentTasks",
        payload: {
          date: pending.date,
          calendarItemIds: pending.proposedCalendarItemIds,
        },
        requiresConfirmation: false,
        explanation: assistantMessage,
        reason: "Décalage des tâches non urgentes après confirmation fatigue.",
      },
    ];

    return {
      state: nextState,
      actionsExecuted,
      replanDates: execution.replanDates,
      assistantMessage,
      explanation: ["conversation_action_executed"],
    };
  }

  return null;
}

export async function proposeFatigueRescheduleAfterConfirmation({
  state,
  runtimeContext,
  appendMessage,
  createMessage,
}: {
  state: ConversationState;
  runtimeContext: NlpRuntimeContext;
  appendMessage: AppendMessageFn;
  createMessage: MessageFactory;
}): Promise<ConversationTurnResult> {
  const { pending, prompt } = await buildFatigueRescheduleProposal({
    userId: runtimeContext.userId,
    date: runtimeContext.referenceDate,
  });

  const nextState = appendMessage(
    {
      ...state,
      pending: {
        kind: "conversation_action",
        action: pending,
        prompt,
      },
    },
    createMessage("assistant", prompt),
  );

  return {
    state: nextState,
    actionsExecuted: [],
    replanDates: [],
    assistantMessage: prompt,
    explanation: ["fatigue_reschedule_proposed"],
  };
}
