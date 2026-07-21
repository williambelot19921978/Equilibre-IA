import { addDaysToDate } from "../lib/time/deviceClock";
import { applyBlockAction } from "./blockActionService";
import { loadDisplayedDayPlan } from "./planningService";
import { getUserTasks } from "./tasksService";
import {
  identifyDeferrableTimelineEntries,
  type DeferrableTaskCandidate,
} from "../lib/planning/deferrableTasks";

export {
  identifyDeferrableTimelineEntries,
  URGENT_PRIORITY_THRESHOLD,
  type DeferrableTaskCandidate,
} from "../lib/planning/deferrableTasks";

export type RescheduledTaskMove = {
  title: string;
  fromDate: string;
  toDate: string;
  calendarItemId: string;
  taskId: string | null;
};

export type RescheduleNonUrgentResult = {
  moved: RescheduledTaskMove[];
  skipped: Array<{ title: string; reason: string }>;
  summary: string;
};

function formatFrenchDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function resolveTargetDates(fromDate: string, count: number): string[] {
  const dates: string[] = [];
  for (let offset = 1; offset <= Math.max(count, 7); offset += 1) {
    dates.push(addDaysToDate(fromDate, offset));
    if (dates.length >= count) break;
  }
  return dates;
}

export async function listDeferrableTasksForDay({
  userId,
  date,
}: {
  userId: string;
  date: string;
}): Promise<DeferrableTaskCandidate[]> {
  try {
    const [displayed, tasks] = await Promise.all([
      loadDisplayedDayPlan({ userId, date }),
      getUserTasks(userId),
    ]);

    if (!displayed) return [];

    const tasksById = new Map(tasks.map((task) => [task.id, task] as const));

    return identifyDeferrableTimelineEntries({
      timeline: displayed.timeline,
      items: displayed.items,
      tasksById,
    });
  } catch {
    return [];
  }
}

export function buildRescheduleSummary(moved: RescheduledTaskMove[]): string {
  if (moved.length === 0) {
    return "Je n'ai trouvé aucune tâche non urgente à décaler pour aujourd'hui.";
  }

  const parts = moved.map((move) => {
    const dayLabel =
      move.toDate === addDaysToDate(move.fromDate, 1)
        ? "demain"
        : formatFrenchDate(move.toDate);
    return `« ${move.title} » à ${dayLabel}`;
  });

  const unchangedHint =
    moved.length === 1
      ? "Les rendez-vous et tâches urgentes restent inchangés."
      : "Tes rendez-vous et tâches urgentes restent inchangés.";

  return `C'est fait. J'ai décalé ${parts.join(" et ")}. ${unchangedHint}`;
}

export async function rescheduleNonUrgentTasks({
  userId,
  date,
  calendarItemIds,
}: {
  userId: string;
  date: string;
  calendarItemIds?: string[];
}): Promise<RescheduleNonUrgentResult> {
  const displayed = await loadDisplayedDayPlan({ userId, date });
  if (!displayed) {
    return {
      moved: [],
      skipped: [{ title: "planning", reason: "Journée introuvable." }],
      summary: "Je n'ai pas pu charger ton planning pour aujourd'hui.",
    };
  }

  const tasks = await getUserTasks(userId);
  const tasksById = new Map(tasks.map((task) => [task.id, task] as const));

  let candidates = identifyDeferrableTimelineEntries({
    timeline: displayed.timeline,
    items: displayed.items,
    tasksById,
  });

  if (calendarItemIds && calendarItemIds.length > 0) {
    const allowed = new Set(calendarItemIds);
    candidates = candidates.filter((candidate) =>
      allowed.has(candidate.calendarItemId),
    );
  }

  if (candidates.length === 0) {
    return {
      moved: [],
      skipped: [],
      summary:
        "Je n'ai pas trouvé de tâche non urgente déplaçable. Tes rendez-vous et tâches urgentes restent en place.",
    };
  }

  const targetDates = resolveTargetDates(date, candidates.length);
  const moved: RescheduledTaskMove[] = [];
  const skipped: Array<{ title: string; reason: string }> = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const targetDate = targetDates[index] ?? addDaysToDate(date, index + 1);
    const entry = displayed.timeline.find(
      (item) => item.calendarItemId === candidate.calendarItemId,
    );

    if (!entry) {
      skipped.push({ title: candidate.title, reason: "Bloc introuvable." });
      continue;
    }

    try {
      await applyBlockAction({
        userId,
        date,
        entry,
        action: "reschedule",
        rescheduleOption: "custom",
        customDateTime: `${targetDate}T${entry.startsAt.slice(11)}`,
      });

      moved.push({
        title: candidate.title,
        fromDate: date,
        toDate: targetDate,
        calendarItemId: candidate.calendarItemId,
        taskId: candidate.taskId,
      });
    } catch (error) {
      skipped.push({
        title: candidate.title,
        reason: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return {
    moved,
    skipped,
    summary: buildRescheduleSummary(moved),
  };
}
