/**
 * EPIC 4C — Planning / Calendar abstraction.
 *
 * Frontière obligatoire entre l'Action Engine et tout fournisseur calendrier
 * (Google, Outlook, Apple, etc.). L'assistant ne doit jamais appeler un
 * connecteur externe directement.
 *
 * Conversation Engine → Secure Action Engine → Planning/Calendar abstraction
 * → services internes et futurs connecteurs.
 */

export type CalendarScope = "internal" | "external" | "synchronized";

export type PlanningCalendarOperation =
  | "createEvent"
  | "updateEvent"
  | "rescheduleEvent"
  | "deleteEvent"
  | "reorganizeDay"
  | "createReminder";

export type PlanningCalendarTarget = {
  readonly operation: PlanningCalendarOperation;
  readonly scope: CalendarScope;
  readonly date?: string;
  readonly entryId?: string;
  readonly summary: string;
};

export type PlanningCalendarPreviewHint = {
  readonly scope: CalendarScope;
  readonly userMessage: string;
};

export type PlanningCalendarCommand = {
  readonly userId: string;
  readonly target: PlanningCalendarTarget;
  readonly payload: Readonly<Record<string, unknown>>;
};

export type PlanningCalendarResult = {
  readonly success: boolean;
  readonly message: string;
  readonly scope: CalendarScope;
  readonly data?: Readonly<Record<string, unknown>>;
};

/** Future gateway — internal planning today, external connectors later. */
export type IPlanningCalendarGateway = {
  createEvent(command: PlanningCalendarCommand): Promise<PlanningCalendarResult>;
  updateEvent(command: PlanningCalendarCommand): Promise<PlanningCalendarResult>;
  rescheduleEvent(command: PlanningCalendarCommand): Promise<PlanningCalendarResult>;
  deleteEvent(command: PlanningCalendarCommand): Promise<PlanningCalendarResult>;
  reorganizeDay(command: PlanningCalendarCommand): Promise<PlanningCalendarResult>;
  createReminder(command: PlanningCalendarCommand): Promise<PlanningCalendarResult>;
};

export const PLANNING_CALENDAR_NOT_IMPLEMENTED =
  "Synchronisation agenda externe — contrat préparé, exécution non disponible dans EPIC 4C.";

export function buildPlanningCalendarTarget(input: {
  operation: PlanningCalendarOperation;
  scope?: CalendarScope;
  date?: string;
  entryId?: string;
  summary: string;
}): PlanningCalendarTarget {
  return {
    operation: input.operation,
    scope: input.scope ?? "internal",
    date: input.date,
    entryId: input.entryId,
    summary: input.summary,
  };
}

export function buildScopePreviewHint(scope: CalendarScope): PlanningCalendarPreviewHint {
  switch (scope) {
    case "external":
      return {
        scope,
        userMessage: "Cette modification affectera votre agenda externe.",
      };
    case "synchronized":
      return {
        scope,
        userMessage:
          "Cette modification affectera Aura et votre agenda.",
      };
    default:
      return {
        scope: "internal",
        userMessage: "Cette modification affectera le planning Aura.",
      };
  }
}

export function isPlanningCalendarOperation(
  actionType: string,
): actionType is PlanningCalendarOperation {
  return (
    actionType === "createEvent" ||
    actionType === "updateEvent" ||
    actionType === "rescheduleEvent" ||
    actionType === "deleteEvent" ||
    actionType === "reorganizeDay" ||
    actionType === "createReminder"
  );
}

/** Maps secure action types to planning/calendar operations when applicable. */
export function resolvePlanningOperation(
  actionType: string,
): PlanningCalendarOperation | null {
  switch (actionType) {
    case "reorganizeDay":
      return "reorganizeDay";
    case "rescheduleEvent":
      return "rescheduleEvent";
    case "moveTask":
      return "rescheduleEvent";
    case "createReminder":
      return "createReminder";
    default:
      return null;
  }
}

export function resolveDefaultCalendarScope(actionType: string): CalendarScope {
  if (actionType === "rescheduleEvent") return "synchronized";
  if (actionType === "createReminder") return "internal";
  if (actionType === "reorganizeDay" || actionType === "moveTask") return "internal";
  return "internal";
}
