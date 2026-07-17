import { getActivePeriodsForDate } from "../../ai/familyContextEngine";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { WorkSchedulePatternData } from "../../types/workSchedule";
import { describeWorkExceptionBadge } from "../work/workExceptionTypes";
import { resolveWorkStatusForDate } from "../work/resolveWorkStatusForDate";

export type CalendarDayStatus =
  | "workday"
  | "restday"
  | "compensatory_rest"
  | "exceptional_work"
  | "vacation"
  | "weekend"
  | "holiday"
  | "travel"
  | "special"
  | "neutral";

export type CalendarDayStatusSource =
  | "profile"
  | "override"
  | "context_period"
  | "holiday"
  | "pattern"
  | "none";

export type CalendarDayOverride = {
  date: string;
  forceWork?: boolean;
  forceRest?: boolean;
};

export type ResolvedCalendarDayStatus = {
  status: CalendarDayStatus;
  colorToken: string;
  label: string;
  reason: string;
  source: CalendarDayStatusSource;
  badge?: string;
};

const VACATION_TYPES = new Set(["user_vacation", "children_vacation"]);
const TRAVEL_TYPES = new Set(["work_travel"]);

const SPECIAL_CONTEXT_TYPES = new Set([
  "solo_parent",
  "partner_absent",
  "family_event",
  "child_sick",
  "child_absent",
  "school_closed",
  "exceptional_childcare",
]);

const STATUS_META: Record<
  CalendarDayStatus,
  { colorToken: string; label: string; badge?: string }
> = {
  workday: { colorToken: "day-work", label: "Travail" },
  exceptional_work: { colorToken: "day-work", label: "Travail exceptionnel", badge: "!" },
  restday: { colorToken: "day-rest", label: "Repos" },
  compensatory_rest: { colorToken: "day-rest", label: "Repos compensateur" },
  vacation: { colorToken: "day-vacation", label: "Vacances" },
  weekend: { colorToken: "day-weekend", label: "Week-end" },
  holiday: { colorToken: "day-holiday", label: "Jour férié" },
  travel: { colorToken: "day-travel", label: "Déplacement" },
  special: { colorToken: "day-special", label: "Journée spéciale" },
  neutral: { colorToken: "day-neutral", label: "" },
};

function buildResult(
  status: CalendarDayStatus,
  reason: string,
  source: CalendarDayStatusSource,
): ResolvedCalendarDayStatus {
  const meta = STATUS_META[status];
  return {
    status,
    colorToken: meta.colorToken,
    label: meta.label,
    reason,
    source,
    badge: meta.badge,
  };
}

function findVacationPeriod(
  periods: FamilyContextPeriodRecord[],
): FamilyContextPeriodRecord | undefined {
  return periods.find((period) => VACATION_TYPES.has(period.context_type));
}

function findTravelPeriod(
  periods: FamilyContextPeriodRecord[],
): FamilyContextPeriodRecord | undefined {
  return periods.find((period) => TRAVEL_TYPES.has(period.context_type));
}

function findSpecialPeriod(
  periods: FamilyContextPeriodRecord[],
): FamilyContextPeriodRecord | undefined {
  return periods.find((period) => {
    if (!SPECIAL_CONTEXT_TYPES.has(period.context_type)) {
      return false;
    }

    if (
      period.context_type === "other" &&
      period.impact?.disableWork === true
    ) {
      return false;
    }

    return true;
  });
}

function mapWorkSource(
  source: string,
): CalendarDayStatusSource {
  if (source === "override" || source === "exceptional") return "override";
  if (source === "pattern" || source === "compensatory") return "pattern";
  if (source === "vacation") return "context_period";
  return "profile";
}

/**
 * Détermine l'état principal d'une cellule calendrier.
 * Source unique pour calendrier compact et complet.
 */
export function resolveCalendarDayStatus({
  date,
  workDays,
  workSchedulePattern,
  contextPeriods = [],
  holidays = [],
  overrides = [],
  defaultStartTime = "09:00",
  defaultEndTime = "17:00",
  commuteMinutes,
}: {
  date: string;
  workDays: string[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  contextPeriods?: FamilyContextPeriodRecord[];
  holidays?: string[];
  overrides?: CalendarDayOverride[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  commuteMinutes?: number;
}): ResolvedCalendarDayStatus {
  const activePeriods = getActivePeriodsForDate(contextPeriods, date);

  const vacationPeriod = findVacationPeriod(activePeriods);
  if (vacationPeriod) {
    return buildResult(
      "vacation",
      vacationPeriod.context_type === "children_vacation"
        ? "Vacances enfants actives sur cette date."
        : "Période de vacances active sur cette date.",
      "context_period",
    );
  }

  const travelPeriod = findTravelPeriod(activePeriods);
  if (travelPeriod) {
    return buildResult(
      "travel",
      "Déplacement professionnel ou contexte de voyage actif.",
      "context_period",
    );
  }

  const specialPeriod = findSpecialPeriod(activePeriods);
  if (specialPeriod) {
    const reasonByType: Partial<Record<FamilyContextPeriodRecord["context_type"], string>> =
      {
        solo_parent: "Parent seul avec les enfants.",
        partner_absent: "Conjoint absent — journée adaptée.",
        family_event: "Événement familial prévu.",
        child_sick: "Enfant malade — contexte exceptionnel.",
        child_absent: "Enfant absent — contexte exceptionnel.",
        school_closed: "École fermée — contexte exceptionnel.",
        exceptional_childcare: "Garde exceptionnelle prévue.",
      };

    return buildResult(
      "special",
      reasonByType[specialPeriod.context_type] ??
        "Contexte familial particulier actif.",
      "context_period",
    );
  }

  if (holidays.includes(date)) {
    return buildResult(
      "holiday",
      "Jour férié enregistré.",
      "holiday",
    );
  }

  const manualOverrides = overrides
    .filter((entry) => entry.date === date && (entry.forceWork || entry.forceRest))
    .map((entry) => ({
      date: entry.date,
      work: entry.forceWork === true,
      reason: entry.forceWork
        ? "Travail forcé manuellement."
        : "Repos forcé manuellement.",
    }));

  const workStatus = resolveWorkStatusForDate({
    date,
    fixedWorkDays: workDays,
    workSchedulePattern,
    contextPeriods,
    manualOverrides,
    defaultStartTime,
    defaultEndTime,
    commuteMinutes,
  });

  const statusSource = mapWorkSource(workStatus.source);

  if (workStatus.isCompensatoryRest) {
    return buildResult(
      "compensatory_rest",
      workStatus.reason,
      "pattern",
    );
  }

  if (workStatus.isWorkDay && workStatus.partialWorkDay) {
    const badge = describeWorkExceptionBadge(workStatus.partialWorkDay.type);
    return {
      ...buildResult(
        "workday",
        workStatus.reason,
        statusSource,
      ),
      badge,
      label: "Demi-journée travaillée",
    };
  }

  if (workStatus.isWorkDay && workStatus.isExceptional) {
    return buildResult(
      "exceptional_work",
      workStatus.reason,
      "override",
    );
  }

  if (workStatus.isWorkDay) {
    return buildResult(
      "workday",
      workStatus.reason,
      statusSource,
    );
  }

  if (workStatus.isWeekendNonWork) {
    return buildResult(
      "weekend",
      workStatus.reason,
      statusSource,
    );
  }

  if (workDays.length > 0 || workSchedulePattern) {
    return buildResult(
      "restday",
      workStatus.reason,
      statusSource,
    );
  }

  return buildResult(
    "neutral",
    "Aucune information de rythme disponible.",
    "none",
  );
}
