import {
  getChildcareAdaptationMessage,
  resolveChildcareImpact,
} from "../lib/family/childcareImpact";
import {
  FAMILY_CONTEXT_TYPE_OPTIONS,
  type FamilyContextType,
} from "../config/familyContextOptions";
import type { ChildcareMode } from "../types/childcare";
import type {
  FamilyContextImpact,
  FamilyContextPeriodRecord,
  FamilyContextType as ContextType,
  FamilyContextWarning,
  ResolvedFamilyContext,
} from "../types/familyContext";

const DEFAULT_MAX_FILL = 0.8;
const SOLO_PARENT_MAX_FILL = 0.6;

const TYPE_IMPACTS: Record<ContextType, FamilyContextImpact> = {
  user_vacation: { disableWork: true },
  children_vacation: { disableSchoolDeparture: true },
  work_travel: { unavailableUserIds: [] },
  partner_absent: {},
  partner_present: {},
  solo_parent: {
    maxFillRatio: SOLO_PARENT_MAX_FILL,
    reducePersonalTasks: true,
  },
  child_absent: { disableSchoolDeparture: true },
  child_sick: {
    avoidLongTasks: true,
    onlyMicroTasks: true,
    maxFillRatio: SOLO_PARENT_MAX_FILL,
  },
  school_closed: { disableSchoolDeparture: true },
  exceptional_childcare: {},
  exceptional_work_hours: {},
  family_event: {},
  other: {},
};

function mergeImpact(
  base: FamilyContextImpact,
  extra: FamilyContextImpact,
): FamilyContextImpact {
  return {
    disableWork: base.disableWork || extra.disableWork,
    disableSchoolDeparture:
      base.disableSchoolDeparture || extra.disableSchoolDeparture,
    maxFillRatio: Math.min(
      base.maxFillRatio ?? DEFAULT_MAX_FILL,
      extra.maxFillRatio ?? DEFAULT_MAX_FILL,
    ),
    reducePersonalTasks:
      base.reducePersonalTasks || extra.reducePersonalTasks,
    avoidLongTasks: base.avoidLongTasks || extra.avoidLongTasks,
    onlyMicroTasks: base.onlyMicroTasks || extra.onlyMicroTasks,
    unavailableUserIds: [
      ...(base.unavailableUserIds ?? []),
      ...(extra.unavailableUserIds ?? []),
    ],
  };
}

function periodCoversInstant(
  period: FamilyContextPeriodRecord,
  instant: Date,
): boolean {
  if (period.status !== "active") {
    return false;
  }

  const start = new Date(period.starts_at).getTime();
  const end = new Date(period.ends_at).getTime();
  const time = instant.getTime();

  return time >= start && time <= end;
}

export function getActivePeriodsForDate(
  periods: FamilyContextPeriodRecord[],
  date: string,
): FamilyContextPeriodRecord[] {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  return periods.filter((period) => {
    if (period.status !== "active") return false;

    const start = new Date(period.starts_at).getTime();
    const end = new Date(period.ends_at).getTime();

    return start <= dayEnd.getTime() && end >= dayStart.getTime();
  });
}

export function findOverlappingPeriods(
  periods: FamilyContextPeriodRecord[],
): Array<[FamilyContextPeriodRecord, FamilyContextPeriodRecord]> {
  const active = periods.filter((period) => period.status === "active");
  const overlaps: Array<[FamilyContextPeriodRecord, FamilyContextPeriodRecord]> =
    [];

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const aStart = new Date(active[i].starts_at).getTime();
      const aEnd = new Date(active[i].ends_at).getTime();
      const bStart = new Date(active[j].starts_at).getTime();
      const bEnd = new Date(active[j].ends_at).getTime();

      if (aStart < bEnd && bStart < aEnd) {
        overlaps.push([active[i], active[j]]);
      }
    }
  }

  return overlaps;
}

function buildOverlapWarningId(
  a: FamilyContextPeriodRecord,
  b: FamilyContextPeriodRecord,
): string {
  return [a.id, b.id].sort().join(":");
}

function buildOverlapWarnings(
  overlaps: Array<[FamilyContextPeriodRecord, FamilyContextPeriodRecord]>,
): FamilyContextWarning[] {
  const seen = new Set<string>();
  const warnings: FamilyContextWarning[] = [];

  for (const [a, b] of overlaps) {
    const id = buildOverlapWarningId(a, b);
    if (seen.has(id)) continue;
    seen.add(id);

    warnings.push({
      id,
      message: `Chevauchement entre « ${a.title} » et « ${b.title} » — vérifie les périodes.`,
    });
  }

  return warnings;
}

export function resolveFamilyContextForDate({
  periods,
  date,
  currentUserId,
}: {
  periods: FamilyContextPeriodRecord[];
  date: string;
  currentUserId: string;
}): ResolvedFamilyContext {
  const activePeriods = getActivePeriodsForDate(periods, date);
  const noon = new Date(`${date}T12:00:00`);

  let mergedImpact: FamilyContextImpact = {
    maxFillRatio: DEFAULT_MAX_FILL,
  };

  for (const period of activePeriods) {
    if (!periodCoversInstant(period, noon)) {
      continue;
    }

    const typeImpact = TYPE_IMPACTS[period.context_type] ?? {};
    const customImpact = period.impact ?? {};

    let periodImpact = mergeImpact(typeImpact, customImpact);

    if (period.context_type === "work_travel" && period.user_id) {
      periodImpact = mergeImpact(periodImpact, {
        unavailableUserIds: [period.user_id],
      });
    }

    if (period.context_type === "children_vacation") {
      const childcareImpact = resolveChildcareImpact(
        period.impact?.childcareMode as ChildcareMode | undefined,
      );
      periodImpact = mergeImpact(periodImpact, childcareImpact);
    }

    mergedImpact = mergeImpact(mergedImpact, periodImpact);
  }

  const overlaps = findOverlappingPeriods(activePeriods);
  const warnings = buildOverlapWarnings(overlaps);

  const adaptations: string[] = [];

  const userVacation = activePeriods.some(
    (period) =>
      period.context_type === "user_vacation" &&
      periodCoversInstant(period, noon),
  );
  const childrenVacation = activePeriods.some(
    (period) =>
      period.context_type === "children_vacation" &&
      periodCoversInstant(period, noon),
  );
  const soloParentWithChildren = activePeriods.some(
    (period) =>
      period.context_type === "solo_parent" &&
      periodCoversInstant(period, noon),
  );
  const childSick = activePeriods.some(
    (period) =>
      period.context_type === "child_sick" &&
      periodCoversInstant(period, noon),
  );
  const onlyMicroTasks = childSick || (mergedImpact.onlyMicroTasks ?? false);

  if (userVacation) {
    adaptations.push(
      "Les horaires de travail habituels sont désactivés pendant tes vacances.",
    );
  }

  if (soloParentWithChildren) {
    adaptations.push(
      "Journée allégée car tu es seule avec les enfants (max 60 % du temps libre).",
    );
  }

  const childrenVacationPeriod = activePeriods.find(
    (period) =>
      period.context_type === "children_vacation" &&
      periodCoversInstant(period, noon),
  );
  const childcareMode =
    (childrenVacationPeriod?.impact?.childcareMode as ChildcareMode | undefined) ??
    null;

  if (childrenVacation) {
    if (childcareMode) {
      const childcareMessage = getChildcareAdaptationMessage(childcareMode);
      if (childcareMessage) {
        adaptations.push(childcareMessage);
      }
    } else {
      adaptations.push(
        "Pas de départ école/crèche automatique — précise le mode de garde si besoin.",
      );
    }
  }

  if (childSick) {
    adaptations.push(
      "Charge réduite et micro-tâches uniquement — enfant malade.",
    );
  }

  const unavailableUserIds = [
    ...new Set(mergedImpact.unavailableUserIds ?? []),
  ];

  if (
    unavailableUserIds.length > 0 &&
    unavailableUserIds.includes(currentUserId)
  ) {
    adaptations.push("Tu es indisponible sur cette période (déplacement).");
  }

  return {
    activePeriods,
    disableWork: mergedImpact.disableWork ?? false,
    disableSchoolDeparture: mergedImpact.disableSchoolDeparture ?? false,
    maxFillRatio: mergedImpact.maxFillRatio ?? DEFAULT_MAX_FILL,
    soloParentWithChildren,
    childSick,
    onlyMicroTasks,
    childrenVacation,
    userVacation,
    childcareMode,
    unavailableUserIds,
    adaptations,
    warnings,
  };
}

export function getContextTypeLabel(type: FamilyContextType): string {
  return (
    FAMILY_CONTEXT_TYPE_OPTIONS.find((option) => option.value === type)
      ?.label ?? type
  );
}

export function formatHomeContextHint({
  period,
  currentUserId,
  memberNames = {},
}: {
  period: FamilyContextPeriodRecord;
  currentUserId: string;
  memberNames?: Record<string, string>;
}): string {
  const endLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(new Date(period.ends_at));

  if (period.context_type === "work_travel") {
    if (period.user_id === currentUserId) {
      return `Tu es en déplacement jusqu'au ${endLabel}`;
    }

    const name = period.user_id
      ? memberNames[period.user_id] ?? period.title
      : period.title;

    return `${name} est en déplacement jusqu'au ${endLabel}`;
  }

  if (period.context_type === "user_vacation") {
    return "Vacances familiales en cours";
  }

  if (period.context_type === "solo_parent") {
    return "Aujourd'hui, tu gères seule les enfants";
  }

  if (period.context_type === "child_sick") {
    return period.title.trim().length > 0
      ? period.title
      : "Enfant malade — journée allégée";
  }

  if (period.context_type === "children_vacation") {
    return "Vacances des enfants — pas de départ école automatique";
  }

  return formatActiveContextBanner(period);
}

export function getHomeContextHints({
  periods,
  date,
  currentUserId,
  memberNames = {},
}: {
  periods: FamilyContextPeriodRecord[];
  date: string;
  currentUserId: string;
  memberNames?: Record<string, string>;
}): string[] {
  const noon = new Date(`${date}T12:00:00`);
  const active = getActivePeriodsForDate(periods, date).filter((period) =>
    periodCoversInstant(period, noon),
  );

  return active.map((period) =>
    formatHomeContextHint({ period, currentUserId, memberNames }),
  );
}

export function formatActiveContextBanner(
  period: FamilyContextPeriodRecord,
): string {
  const start = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(new Date(period.starts_at));
  const end = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(new Date(period.ends_at));

  if (period.title.trim().length > 0) {
    return `${period.title} (du ${start} au ${end})`;
  }

  return `${getContextTypeLabel(period.context_type)} du ${start} au ${end}`;
}
