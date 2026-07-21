/**
 * EPIC3-B — Deterministic household opportunity detection (observe, suggest, never act).
 */

import { isGoalsEnabled } from "../../config/featureFlags";
import { computeGoalProgress } from "../goals/computeGoalProgress";
import { computeGoalWeightsFromUserGoals } from "../goals/goalEnginePort";
import type {
  HouseholdOverview,
  MemberOverviewSnapshot,
} from "../../types/householdOverview";
import type { HouseholdOpportunity } from "../../types/householdOpportunity";
import { MAX_HOUSEHOLD_OPPORTUNITIES } from "../../types/householdOpportunity";
import {
  buildBothBusyReasonCodes,
  buildLoadImbalanceReasonCodes,
  buildSharedFreeTimeReasonCodes,
  buildStaleGoalSupportReasonCodes,
} from "./buildHouseholdOpportunityReasonCodes";

const HEAVY_SCHEDULED_MINUTES = 240;
const LOW_FREE_MINUTES = 60;
const SIGNIFICANT_FREE_MINUTES = 90;
const STALE_GOAL_DAYS = 5;

function isMemberHeavyLoad(member: {
  scheduledMinutesToday: number;
  loadLabel: string;
  dataAvailable: boolean;
}): boolean {
  if (!member.dataAvailable) return false;

  return (
    member.scheduledMinutesToday >= HEAVY_SCHEDULED_MINUTES ||
    member.loadLabel === "Journée chargée"
  );
}

function isMemberLowFree(member: {
  freeMinutesRemaining: number;
  dataAvailable: boolean;
}): boolean {
  return member.dataAvailable && member.freeMinutesRemaining < LOW_FREE_MINUTES;
}

function isMemberSignificantlyFree(member: {
  freeMinutesRemaining: number;
  dataAvailable: boolean;
}): boolean {
  return (
    member.dataAvailable && member.freeMinutesRemaining >= SIGNIFICANT_FREE_MINUTES
  );
}

function detectLoadImbalance(
  overview: HouseholdOverview,
): HouseholdOpportunity | null {
  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  for (const busyMember of available) {
    if (!isMemberHeavyLoad(busyMember) && !isMemberLowFree(busyMember)) {
      continue;
    }

    const freeMember = available.find(
      (candidate) =>
        candidate.memberId !== busyMember.memberId &&
        isMemberSignificantlyFree(candidate),
    );

    if (!freeMember) continue;

    return {
      id: `household-opp-load-${busyMember.memberId}-${freeMember.memberId}`,
      kind: "load_imbalance",
      title: "Un créneau pourrait aider l'équilibre du foyer",
      explanation: `Il pourrait être utile d'envisager si ${freeMember.displayName} pourrait apporter un coup de main — ${busyMember.displayName} a peu de marge aujourd'hui.`,
      explainabilityReasonCodes: buildLoadImbalanceReasonCodes(true),
      contextLabels: [
        `${freeMember.displayName} est disponible`,
        `${busyMember.displayName} a peu de temps libre`,
        "Aucun conflit détecté",
      ],
      priority: 85,
    };
  }

  return null;
}

function detectSharedFreeTime(
  overview: HouseholdOverview,
): HouseholdOpportunity | null {
  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  const sharedWindow = overview.availabilityWindows.find(
    (window) =>
      window.freeMemberNames.length >= 2 &&
      window.freeMemberNames.length === available.length,
  );

  if (!sharedWindow) return null;

  return {
    id: `household-opp-shared-${sharedWindow.id}`,
    kind: "shared_free_time",
    title: "Un moment partagé semble possible",
    explanation: `Vous pourriez profiter du ${sharedWindow.label.toLowerCase()} pour un temps ensemble.`,
    explainabilityReasonCodes: buildSharedFreeTimeReasonCodes(),
    contextLabels: [
      `Créneau commun : ${sharedWindow.label}`,
      "Tout le monde semble libre sur cette période",
      "Aucun conflit détecté",
    ],
    priority: 65,
  };
}

function detectBothBusy(
  overview: HouseholdOverview,
): HouseholdOpportunity | null {
  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  const allHeavy = available.every(
    (member) =>
      isMemberHeavyLoad(member) ||
      member.freeMinutesRemaining < LOW_FREE_MINUTES,
  );

  if (!allHeavy && !overview.summary.allMembersBusy) {
    return null;
  }

  return {
    id: "household-opp-both-busy",
    kind: "both_busy",
    title: "Journée dense pour le foyer",
    explanation:
      "Il pourrait être utile de limiter de nouveaux engagements aujourd'hui — la marge du foyer est faible.",
    explainabilityReasonCodes: buildBothBusyReasonCodes(),
    contextLabels: [
      "Les membres du foyer sont tous très chargés",
      "Peu de temps libre restant",
      "Aucun changement n'est imposé",
    ],
    priority: 75,
  };
}

function detectStaleGoalSupport(
  overview: HouseholdOverview,
  snapshots: readonly MemberOverviewSnapshot[],
): HouseholdOpportunity | null {
  if (!isGoalsEnabled()) return null;

  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  const supportMember = available.find((member) =>
    isMemberSignificantlyFree(member),
  );
  if (!supportMember) return null;

  let bestGoal: {
    goalName: string;
    ownerName: string;
    ownerId: string;
    staleDays: number;
    weight: number;
  } | null = null;

  for (const memberGoals of overview.memberGoals) {
    if (memberGoals.memberId === supportMember.memberId) continue;

    const snapshot = snapshots.find(
      (item) => item.memberId === memberGoals.memberId,
    );
    if (!snapshot) continue;

    const goals = memberGoals.activeGoals;
    if (goals.length === 0) continue;

    const weights = computeGoalWeightsFromUserGoals(goals, snapshot.tasks);

    for (const goal of goals) {
      const progress = computeGoalProgress(goal, [...snapshot.tasks]);
      const staleDays = progress.daysSinceLastProgress;

      if (
        staleDays === null ||
        staleDays < STALE_GOAL_DAYS ||
        progress.percent >= 100
      ) {
        continue;
      }

      const weight = weights.weights[goal.id] ?? 0;
      const candidate = {
        goalName: goal.name,
        ownerName: memberGoals.displayName,
        ownerId: memberGoals.memberId,
        staleDays,
        weight,
      };

      if (!bestGoal || candidate.weight > bestGoal.weight) {
        bestGoal = candidate;
      }
    }
  }

  if (!bestGoal) return null;

  return {
    id: `household-opp-goal-${bestGoal.ownerId}`,
    kind: "stale_goal_support",
    title: "Un objectif pourrait bénéficier d'un soutien",
    explanation: `L'objectif « ${bestGoal.goalName} » n'a pas avancé depuis plusieurs jours. ${supportMember.displayName} dispose de créneaux libres — un soutien ponctuel pourrait être utile.`,
    explainabilityReasonCodes: buildStaleGoalSupportReasonCodes(),
    contextLabels: [
      `${bestGoal.ownerName} — objectif « ${bestGoal.goalName} » en pause`,
      `${supportMember.displayName} est disponible`,
      "Aucun conflit détecté",
    ],
    priority: 80,
  };
}

export function buildHouseholdOpportunities(input: {
  overview: HouseholdOverview;
  memberSnapshots: readonly MemberOverviewSnapshot[];
}): HouseholdOpportunity[] {
  const { overview } = input;

  if (overview.summary.memberCount === 0) {
    return [];
  }

  if (overview.summary.memberCount === 1) {
    return [];
  }

  const candidates: HouseholdOpportunity[] = [];

  const loadImbalance = detectLoadImbalance(overview);
  if (loadImbalance) candidates.push(loadImbalance);

  const sharedFree = detectSharedFreeTime(overview);
  if (sharedFree) candidates.push(sharedFree);

  const bothBusy = detectBothBusy(overview);
  if (bothBusy) candidates.push(bothBusy);

  const staleGoal = detectStaleGoalSupport(overview, input.memberSnapshots);
  if (staleGoal) candidates.push(staleGoal);

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_HOUSEHOLD_OPPORTUNITIES);
}
