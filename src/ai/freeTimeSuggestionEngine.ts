import type { PlanningContext } from "./memoryEngine";
import type { HouseholdMemoryContext } from "./memoryEngine";
import type { TaskRecord } from "../types";
import type {
  FreeTimeSuggestion,
} from "../types/freeTimeSuggestion";
import { generateFreeTimeSuggestionsFromLifeContext } from "../lib/planning/lifeProposalAdapter";
import { isIntenseSportBlocked } from "./sportSessionGenerator";

export type FreeSlotInput = {
  id: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  slotKind?: "day" | "evening_available";
};

function getHourFromIso(iso: string): number {
  return new Date(iso).getHours();
}

function sortSuggestions(suggestions: FreeTimeSuggestion[]): FreeTimeSuggestion[] {
  const priorityWeight = { high: 0, medium: 1, low: 2 };

  return [...suggestions]
    .sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority])
    .slice(0, 5);
}

function shouldOfferSpiritual(faithImportance?: string): boolean {
  return faithImportance !== "disabled" && Boolean(faithImportance);
}

function isVacationContext(context: PlanningContext): boolean {
  return (
    context.familyContext.userVacation ||
    context.familyContext.childrenVacation ||
    context.familyContext.activePeriods.some(
      (period) =>
        period.context_type === "user_vacation" ||
        period.context_type === "children_vacation",
    )
  );
}

function findStudyTask(tasks: TaskRecord[]): TaskRecord | null {
  return (
    tasks.find(
      (task) =>
        task.status === "todo" &&
        (task.category === "studies" ||
          task.category === "study" ||
          task.title.toLowerCase().includes("révis")),
    ) ?? null
  );
}

export function generateFreeTimeSuggestions({
  slot,
  planningContext,
  tasks = [],
  calendarItems = [],
  taskActivityEvents = [],
  primarySuggestion,
}: {
  slot: FreeSlotInput;
  date: string;
  planningContext: PlanningContext;
  memoryContext?: HouseholdMemoryContext | null;
  tasks?: TaskRecord[];
  calendarItems?: import("../types/database").CalendarItemRecord[];
  taskActivityEvents?: import("../types/taskActivity").TaskActivityEventRecord[];
  primarySuggestion?: import("../lib/planning/displayedDayTimeline").TimelineSlotSuggestion;
}): FreeTimeSuggestion[] {
  const lifeContext = planningContext.lifeContext;

  if (lifeContext) {
    const fromLife = generateFreeTimeSuggestionsFromLifeContext({
      slot,
      lifeContext,
      planningContext,
      tasks,
      calendarItems,
      taskActivityEvents,
      primarySuggestion,
    });

    if (fromLife.length > 0) {
      return fromLife;
    }
  }

  return generateLegacyFreeTimeSuggestions({
    slot,
    planningContext,
    tasks,
  });
}

function generateLegacyFreeTimeSuggestions({
  slot,
  planningContext,
  tasks = [],
}: {
  slot: FreeSlotInput;
  planningContext: PlanningContext;
  tasks?: TaskRecord[];
}): FreeTimeSuggestion[] {
  const profile = planningContext.profile;
  const mainPriority = planningContext.mainPriority;
  const fc = planningContext.familyContext;
  const lifeContext = planningContext.lifeContext;
  const hour = getHourFromIso(slot.startsAt);
  const lateEvening = hour >= 21;
  const vacation = isVacationContext(planningContext);
  const maxFill = fc.maxFillRatio ?? 0.8;
  const vacationFillCap = 0.6;
  const suggestions: FreeTimeSuggestion[] = [];

  const keepFree: FreeTimeSuggestion = {
    id: "keep-free",
    type: "keep_free",
    title: "Garder ce temps libre",
    description: "Ne rien prévoir et conserver ce créneau disponible.",
    recommendedDuration: 0,
    reason: "Toujours possible de préserver du repos réel.",
    priority: "high",
    action: "keep_free",
  };

  if (!lateEvening && slot.durationMinutes >= 10) {
    const sportDuration = Math.min(
      slot.durationMinutes,
      profile.sportMinimumMinutes ?? 15,
      20,
    );

    const workoutAlreadyDone = lifeContext?.workoutCompletedToday === true;

    if (
      !workoutAlreadyDone &&
      sportDuration >= 5 &&
      !isIntenseSportBlocked({
        hour,
        intensity: "dynamic",
        afterWorkEnergy: profile.afterWorkEnergy,
      })
    ) {
      suggestions.push({
        id: "sport-short",
        type: "sport",
        title: "Sport court",
        description: `Séance de ${sportDuration} min adaptée à ton énergie.`,
        recommendedDuration: sportDuration,
        reason:
          hour < 21
            ? "Créneau suffisant pour bouger sans surcharge."
            : "Séance douce seulement en fin de journée.",
        priority: mainPriority === "sport" ? "high" : "medium",
        action: "generate_sport",
      });
    }
  }

  const studyTask = findStudyTask(tasks);
  const focusMinutes = profile.preferredFocusMinutes ?? 25;
  const studyDuration = lateEvening
    ? Math.min(20, slot.durationMinutes)
    : Math.min(focusMinutes, slot.durationMinutes, 30);

  if (studyDuration >= 10 && profile.studiesActive !== false) {
    suggestions.push({
      id: "study-short",
      type: "study",
      title: studyTask ? `Réviser : ${studyTask.title}` : "Micro-session d’étude",
      description: studyTask
        ? `Objectif précis pendant ${studyDuration} min.`
        : `Session courte de ${studyDuration} min.`,
      recommendedDuration: studyDuration,
      reason: lateEvening
        ? "Micro-session adaptée au soir."
        : "Priorité études détectée dans ton profil.",
      priority: mainPriority === "studies" ? "high" : "medium",
      action: "assign_study",
      optionalContent: studyTask
        ? { taskId: studyTask.id, taskTitle: studyTask.title }
        : undefined,
    });
  }

  suggestions.push({
    id: "calm-time",
    type: "calm",
    title: "Temps calme",
    description:
      "Musique douce, podcast, silence ou minuterie de repos — sans lancement automatique.",
    recommendedDuration: Math.min(30, slot.durationMinutes),
    reason: "Repos utile, surtout après une journée chargée.",
    priority: slot.slotKind === "evening_available" ? "high" : "medium",
    action: "open_calm",
    optionalContent: {
      spotifyUrl: "https://open.spotify.com/",
      preferences: profile.restPreferences,
    },
  });

  if (
    !fc.unavailableUserIds.includes(planningContext.currentUserId) &&
    (vacation || planningContext.childrenCount > 0) &&
    slot.durationMinutes >= 45 &&
    hour < 20
  ) {
    suggestions.push({
      id: "family-outing",
      type: vacation ? "vacation_activity" : "family_outing",
      title: vacation ? "Sortie en famille" : "Moment famille",
      description: vacation
        ? "Promenade, activité gratuite ou temps partagé."
        : "Sortie simple ou moment calme avec les enfants.",
      recommendedDuration: Math.min(90, slot.durationMinutes),
      reason: vacation
        ? "Tu es en vacances — une sortie légère peut être agréable."
        : "Créneau suffisant pour un moment familial.",
      priority: vacation ? "high" : "medium",
      action: "create_family",
    });
  }

  if (shouldOfferSpiritual(profile.faithImportance)) {
    const mayShow =
      profile.faithImportance === "important" ||
      (profile.faithImportance === "discreet" && hour >= 19) ||
      (profile.faithImportance === "when_needed" &&
        (profile.afterWorkEnergy === "low" || slot.slotKind === "evening_available"));

    if (mayShow) {
      suggestions.push({
        id: "spiritual",
        type: "spiritual",
        title: "Moment spirituel",
        description: "Proposition facultative selon tes préférences.",
        recommendedDuration: Math.min(15, slot.durationMinutes),
        reason: "Selon tes préférences spirituelles.",
        priority: profile.faithImportance === "important" ? "medium" : "low",
        action: "show_spiritual",
      });
    }
  }

  if (vacation && slot.durationMinutes >= 30) {
    suggestions.push({
      id: "vacation-light",
      type: "vacation_activity",
      title: "Activité légère de vacances",
      description:
        "Lecture, organisation maison ou marche — sans remplir toute la journée.",
      recommendedDuration: Math.min(
        Math.floor(slot.durationMinutes * vacationFillCap),
        60,
      ),
      reason: `Rythme vacances : maximum ${Math.round(vacationFillCap * 100)} % du temps libre.`,
      priority: "low",
      action: "create_task",
    });
  }

  const filtered = suggestions.filter((item) => {
    if (vacation && item.recommendedDuration > slot.durationMinutes * vacationFillCap) {
      return false;
    }

    if (!vacation && item.recommendedDuration > slot.durationMinutes * maxFill) {
      return item.type === "keep_free";
    }

    return true;
  });

  const ranked = sortSuggestions([keepFree, ...filtered.filter((s) => s.id !== "keep-free")]);

  return ranked.some((item) => item.id === "keep-free")
    ? ranked
    : [keepFree, ...ranked].slice(0, 5);
}

export function buildVacationSuggestionIntro({
  slot,
  planningContext,
}: {
  slot: FreeSlotInput;
  planningContext: PlanningContext;
}): string {
  const hours = Math.floor(slot.durationMinutes / 60);
  const minutes = slot.durationMinutes % 60;
  const durationLabel =
    hours > 0
      ? `${hours} h${minutes > 0 ? ` ${minutes} min` : ""}`
      : `${minutes} min`;

  if (!isVacationContext(planningContext)) {
    return `Tu disposes de ${durationLabel} libre. Je peux te proposer :`;
  }

  return `Tu es en vacances et tu as ${durationLabel} libre. Je peux te proposer :`;
}
