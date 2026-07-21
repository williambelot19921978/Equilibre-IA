export type ConversationActionType = "reschedule_non_urgent_tasks";

export type ConversationActionPending = {
  type: ConversationActionType;
  reason: "fatigue";
  proposedTaskIds: string[];
  proposedCalendarItemIds: string[];
  proposedTitles: string[];
  date: string;
  createdAt: string;
};

export const RESCHEDULE_CONFIRMATION_PROMPT =
  "D'accord. Je peux alléger ta journée en décalant les tâches non urgentes. Je le fais ?";

export const RESCHEDULE_AMBIGUOUS_PROMPT = "Que souhaites-tu décaler ?";

export function createReschedulePendingAction({
  date,
  taskIds,
  calendarItemIds,
  titles,
}: {
  date: string;
  taskIds: string[];
  calendarItemIds: string[];
  titles: string[];
}): ConversationActionPending {
  return {
    type: "reschedule_non_urgent_tasks",
    reason: "fatigue",
    proposedTaskIds: taskIds,
    proposedCalendarItemIds: calendarItemIds,
    proposedTitles: titles,
    date,
    createdAt: new Date().toISOString(),
  };
}

export function isConversationActionConfirmationPhrase(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    /^(oui|ok|d'accord|daccord|vas-y|vas y|fais-le|fais le|décale|decale|reporte|d'accord,? décale|oui,? décale)\.?$/u.test(
      normalized,
    ) || /^oui,?\s*(décale|decale|vas-y|vas y)/u.test(normalized)
  );
}

export function isConversationActionCancellationPhrase(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    /^(non|laisse|annule|finalement non|pas maintenant)\.?$/u.test(normalized) ||
    /^non,?/u.test(normalized)
  );
}

export function isStandaloneReschedulePhrase(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^(d[eé]cal(e|er)?|report(e|er)?)\.?$/u.test(normalized);
}

export function messageRequestsNonUrgentReschedule(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    /\b(d[eé]cal\w*|report\w*)\b/u.test(normalized) &&
    /\b(pas\s+)?(urgent|importante?s?)\b/u.test(normalized)
  );
}
