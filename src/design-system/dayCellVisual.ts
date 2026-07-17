import type { FamilyContextPeriodRecord } from "../types/familyContext";
import type { WorkSchedulePatternData } from "../types/workSchedule";
import type { MonthDayData } from "../lib/planning/calendarMonthOverview";
import {
  resolveCalendarDayStatus,
  type CalendarDayOverride,
  type CalendarDayStatus,
  type ResolvedCalendarDayStatus,
} from "../lib/calendar/resolveCalendarDayStatus";

export type DayCellVisualType =
  | "work"
  | "rest"
  | "compensatory"
  | "exceptional"
  | "vacation"
  | "weekend"
  | "holiday"
  | "travel"
  | "busy"
  | "special"
  | "default";

export type DayCellVisualStyle = {
  type: DayCellVisualType;
  fill: string;
  text: string;
  icon?: string;
  badge?: string;
  status: ResolvedCalendarDayStatus;
};

export type ResolveDayCellVisualInput = {
  workDays?: string[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  contextPeriods?: FamilyContextPeriodRecord[];
  holidays?: string[];
  overrides?: CalendarDayOverride[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  commuteMinutes?: number;
  /** Conservé pour badges / événements — n'influence pas la couleur principale. */
  dayData?: MonthDayData;
};

const DAY_CELL_STYLES: Record<
  DayCellVisualType,
  Omit<DayCellVisualStyle, "type" | "status">
> = {
  work: { fill: "var(--day-work)", text: "var(--day-work-text)", icon: "💼" },
  rest: { fill: "var(--day-rest)", text: "var(--day-rest-text)", icon: "🛋️" },
  compensatory: {
    fill: "var(--day-rest)",
    text: "var(--day-rest-text)",
    icon: "🛋️",
  },
  exceptional: {
    fill: "var(--day-work)",
    text: "var(--day-work-text)",
    icon: "💼",
    badge: "!",
  },
  vacation: {
    fill: "var(--day-vacation)",
    text: "var(--day-vacation-text)",
    icon: "🏖️",
  },
  weekend: { fill: "var(--day-weekend)", text: "var(--day-weekend-text)" },
  holiday: {
    fill: "var(--day-holiday)",
    text: "var(--day-holiday-text)",
    icon: "🎉",
  },
  travel: {
    fill: "var(--day-travel)",
    text: "var(--day-travel-text)",
    icon: "✈️",
  },
  busy: { fill: "var(--day-busy)", text: "var(--day-busy-text)" },
  special: {
    fill: "var(--day-special)",
    text: "var(--day-special-text)",
    icon: "✨",
  },
  default: { fill: "transparent", text: "var(--color-text)" },
};

function mapStatusToVisualType(status: CalendarDayStatus): DayCellVisualType {
  switch (status) {
    case "workday":
      return "work";
    case "exceptional_work":
      return "exceptional";
    case "restday":
      return "rest";
    case "compensatory_rest":
      return "compensatory";
    case "vacation":
      return "vacation";
    case "weekend":
      return "weekend";
    case "holiday":
      return "holiday";
    case "travel":
      return "travel";
    case "special":
      return "special";
    default:
      return "default";
  }
}

/** Dérive l'apparence d'une cellule depuis le statut principal du jour. */
export function resolveDayCellVisual(
  date: string,
  input: ResolveDayCellVisualInput = {},
): DayCellVisualStyle {
  const status = resolveCalendarDayStatus({
    date,
    workDays: input.workDays ?? [],
    workSchedulePattern: input.workSchedulePattern,
    contextPeriods: input.contextPeriods ?? [],
    holidays: input.holidays ?? [],
    overrides: input.overrides ?? [],
    defaultStartTime: input.defaultStartTime,
    defaultEndTime: input.defaultEndTime,
    commuteMinutes: input.commuteMinutes,
  });

  const type = mapStatusToVisualType(status.status);
  const style = DAY_CELL_STYLES[type];

  return {
    type,
    status,
    ...style,
    badge: status.badge ?? style.badge,
  };
}

export { resolveCalendarDayStatus };
