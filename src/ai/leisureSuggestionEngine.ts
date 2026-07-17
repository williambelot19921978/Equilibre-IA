import type { PlanningContext } from "./memoryEngine";
import {
  LEISURE_ACTIVITIES,
  getLeisureActivitiesByCategory,
} from "../data/leisureContentLibrary";
import type { LifeProposal } from "../types/lifeContext";

export type LeisureSuggestionInput = {
  durationMinutes: number;
  slotHour: number;
  planningContext: PlanningContext;
  slotId?: string;
  workoutCompletedToday?: boolean;
};

function scoreActivity(
  activity: (typeof LEISURE_ACTIVITIES)[number],
  input: LeisureSuggestionInput,
): number {
  let score = 50;
  const fc = input.planningContext.familyContext;
  const profile = input.planningContext.profile;

  if (activity.durationMinutes > input.durationMinutes) return 0;

  if (activity.category === "sport") {
    if (input.slotHour >= 21) return 0;
    if (fc.onlyMicroTasks && activity.durationMinutes > 15) score -= 20;
    if (profile.afterWorkEnergy === "low" && activity.sportType === "run") {
      score -= 30;
    }
    if (activity.sportType === "mobility" || activity.sportType === "walk") {
      score += 15;
    }
  }

  if (activity.tags.includes("famille") && input.planningContext.childrenCount > 0) {
    score += 20;
  }

  if (activity.tags.includes("calme") && profile.afterWorkEnergy === "low") {
    score += 15;
  }

  if (fc.childcareMode === "home_with_me" && activity.durationMinutes > 20) {
    score -= 25;
  }

  if (fc.childcareMode === "summer_camp" && input.slotHour >= 9 && input.slotHour <= 17) {
    score += 10;
  }

  return score;
}

export function buildLeisureProposals(
  input: LeisureSuggestionInput,
): LifeProposal[] {
  const candidates = LEISURE_ACTIVITIES.map((activity) => ({
    activity,
    score: scoreActivity(activity, input),
  }))
    .filter((item) => item.score > 0)
    .filter(
      (item) =>
        !(input.workoutCompletedToday && item.activity.category === "sport"),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return candidates.map(({ activity }) => ({
    id: `leisure-${activity.id}`,
    category: (activity.category === "sport" ? "sport" : "leisure") as LifeProposal["category"],
    title: activity.title,
    description: activity.description,
    durationMinutes: activity.durationMinutes,
    reason: `Proposition loisir adaptée à ton créneau de ${input.durationMinutes} min.`,
    priority: activity.category === "sport" ? "medium" : "low",
    slotId: input.slotId,
    leisureActivityId: activity.id,
  }));
}

export function buildLeisureIntro(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const label =
    hours > 0
      ? `${hours} h${minutes > 0 ? ` ${minutes} min` : ""}`
      : `${minutes} min`;

  return `Tu disposes de ${label} libre. Je peux te proposer :`;
}

export function getFeaturedLeisureForFreeSlot(
  durationMinutes: number,
  childrenCount: number,
): string[] {
  const sport = getLeisureActivitiesByCategory("sport")
    .filter((item) => item.durationMinutes <= durationMinutes)
    .slice(0, 2)
    .map((item) => item.title);

  const leisure = getLeisureActivitiesByCategory("leisure")
    .filter((item) => item.durationMinutes <= durationMinutes)
    .filter((item) =>
      childrenCount > 0 ? true : !item.tags.includes("enfants"),
    )
    .slice(0, 3)
    .map((item) => item.title);

  return [...sport, ...leisure].slice(0, 5);
}
