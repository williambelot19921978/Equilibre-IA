import type { CalendarItemRecord, DayPlan } from "../../types";
import {
  buildDisplayedDayTimeline,
  type DayTimelineEntry,
} from "./displayedDayTimeline";
import { persistedItemToTimelineEntry } from "./displayedDayTimeline";

function sortByStart(entries: DayTimelineEntry[]): DayTimelineEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export function buildHistoricalDayView({
  date,
  persistedItems,
}: {
  date: string;
  persistedItems: CalendarItemRecord[];
}): {
  plan: DayPlan;
  timeline: DayTimelineEntry[];
  archiveWarnings: string[];
} {
  const timeline = sortByStart(
    persistedItems.map((item) => persistedItemToTimelineEntry(item)),
  );

  const archiveWarnings: string[] = [];

  if (timeline.length === 0) {
    archiveWarnings.push(
      "Aucun élément enregistré pour cette date. L’historique n’a pas été sauvegardé ou cette journée n’a pas encore été planifiée.",
    );
  } else if (
    !timeline.some(
      (entry) =>
        entry.visualType === "wake" ||
        entry.visualType === "sleep" ||
        entry.visualType === "work",
    )
  ) {
    archiveWarnings.push(
      "Certaines contraintes habituelles n’ont jamais été enregistrées pour ce jour — seuls les éléments sauvegardés sont affichés.",
    );
  }

  const plan: DayPlan = {
    date,
    constraints: [],
    blocks: [],
    margins: [],
    unplannableTasks: [],
    incompleteData: archiveWarnings,
    freeMinutesRemaining: 0,
    totalFreeMinutes: 0,
    fillPercentage: timeline.length > 0 ? 100 : 0,
    contextAdaptations: [],
    contextWarnings: archiveWarnings,
    ignoredCalendarItems: [],
  };

  return { plan, timeline, archiveWarnings };
}

export function buildPersistedOnlyTimeline({
  persistedItems,
  adultBedTime,
  date,
}: {
  persistedItems: CalendarItemRecord[];
  adultBedTime?: string | null;
  date: string;
}): DayTimelineEntry[] {
  if (persistedItems.length === 0) {
    return [];
  }

  return buildDisplayedDayTimeline({
    constraints: [],
    persistedItems,
    adultBedTime,
    date,
  });
}
