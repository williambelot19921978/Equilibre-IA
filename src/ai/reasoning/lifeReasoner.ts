import type { PlanningContext } from "../memoryEngine";
import type { LifeContext, LifeProposal, ScoredFreeSlot } from "../../types/lifeContext";
import type { HabitProfile } from "../../types/habitProfile";
import type {
  DecisionFactor,
  LifeDecision,
  LifeDecisionAlternative,
} from "../../types/lifeDecision";
import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";
import type { TaskRecord } from "../../types";
import { formatStudyMinutesLabel } from "../../lib/planning/getWeeklyStudyProgress";

export type LifeReasonerInput = {
  proposal: LifeProposal;
  slot?: ScoredFreeSlot;
  lifeContext: LifeContext;
  planningContext?: PlanningContext;
  habitProfile?: HabitProfile | null;
  statistics?: PeriodStatistics | null;
  tasks?: TaskRecord[];
  alternativeProposals?: LifeProposal[];
};

function clampConfidence(value: number): number {
  return Math.max(5, Math.min(98, Math.round(value)));
}

function buildFactors(input: LifeReasonerInput): DecisionFactor[] {
  const { proposal, lifeContext, habitProfile, statistics } = input;
  const factors: DecisionFactor[] = [];
  const hour = input.slot
    ? new Date(input.slot.startsAt).getHours()
    : new Date().getHours();

  if (lifeContext.energyPrediction === "low") {
    factors.push({
      id: "energy-low",
      label: "énergie basse aujourd'hui",
      positive: proposal.category === "calm" || proposal.category === "rest",
    });
  } else {
    factors.push({
      id: "energy-ok",
      label: "fatigue modérée ou faible",
      positive: true,
    });
  }

  if (lifeContext.freeEvening || hour >= 18) {
    factors.push({
      id: "calm-slot",
      label: lifeContext.freeEvening ? "soirée libre" : "créneau disponible",
      positive: true,
    });
  }

  if (lifeContext.workoutCompletedToday) {
    factors.push({
      id: "sport-done",
      label: "sport déjà fait",
      positive: proposal.category !== "sport",
    });
  }

  if (proposal.category === "study") {
    const studyProgress = statistics?.study.progressPercent ?? 0;
    const goalFar = (statistics?.study.weeklyGoalMinutes ?? 0) > 0 && studyProgress < 70;
    factors.push({
      id: "study-goal",
      label: goalFar
        ? "objectif révision non atteint"
        : "révision déjà avancée cette semaine",
      positive: goalFar,
    });
  }

  if (input.slot && input.slot.durationMinutes >= proposal.durationMinutes) {
    factors.push({
      id: "slot-fit",
      label: "créneau adapté",
      positive: true,
    });
  }

  const matchingHabit = habitProfile?.insights.find((insight) => {
    if (proposal.category === "sport" && insight.kind === "weekend_running") {
      const day = new Date(lifeContext.date).getDay();
      return day === 0 || day === 6;
    }
    if (proposal.category === "study" && insight.kind === "revision_morning") {
      return hour < 12;
    }
    if (proposal.category === "calm" && insight.kind === "calm_after_work") {
      return hour >= 17;
    }
    return false;
  });

  if (matchingHabit) {
    factors.push({
      id: `habit-${matchingHabit.id}`,
      label: `habitude : ${matchingHabit.label}`,
      positive: matchingHabit.status !== "rejected",
    });
  }

  if (lifeContext.vacation || lifeContext.restDay) {
    factors.push({
      id: "rest-context",
      label: lifeContext.vacation ? "période de vacances" : "journée de repos",
      positive: proposal.category === "rest" || proposal.category === "family",
    });
  }

  return factors;
}

function computeConfidence(factors: DecisionFactor[], baseScore: number): number {
  let confidence = baseScore;
  for (const factor of factors) {
    confidence += factor.positive ? 4 : -6;
  }
  return clampConfidence(confidence);
}

function buildAlternatives(input: LifeReasonerInput): LifeDecisionAlternative[] {
  const alternatives = (input.alternativeProposals ?? [])
    .filter((item) => item.id !== input.proposal.id)
    .slice(0, 3)
    .map((item) => ({
      title: item.title,
      category: item.category,
      reason: item.reason,
    }));

  if (alternatives.length === 0) {
    return [
      {
        title: "Garder ce temps libre",
        category: "keep_free",
        reason: "Tu peux aussi préserver ce créneau sans rien ajouter.",
      },
    ];
  }

  return alternatives;
}

function buildExplanation(
  input: LifeReasonerInput,
  factors: DecisionFactor[],
  alternatives: LifeDecisionAlternative[],
): LifeDecision["explanation"] {
  const { proposal, slot, lifeContext, statistics } = input;
  const duration =
    proposal.durationMinutes > 0 ? `${proposal.durationMinutes} minutes de ` : "";
  const activityLabel = proposal.title.toLowerCase();

  const positiveFactors = factors.filter((factor) => factor.positive);
  const whyParts = [
    `Je te propose ${duration}${activityLabel}.`,
    proposal.reason,
  ];

  if (proposal.category === "study" && statistics?.study.weeklyGoalMinutes) {
    whyParts.push(
      `Ton objectif hebdomadaire est encore à ${statistics.study.progressPercent} %.`,
    );
  }

  if (lifeContext.workoutCompletedToday && proposal.category !== "sport") {
    whyParts.push("Tu as déjà bougé aujourd'hui.");
  }

  const whyNowParts: string[] = [];
  if (slot) {
    const hour = new Date(slot.startsAt).getHours();
    if (hour < 12) whyNowParts.push("C'est un créneau calme en matinée.");
    else if (hour >= 18) whyNowParts.push("Tu disposes d'un moment libre ce soir.");
    else whyNowParts.push("Tu as une fenêtre disponible maintenant.");
  } else {
    whyNowParts.push("C'est le meilleur moment disponible dans ta journée.");
  }

  if (lifeContext.energyPrediction !== "low") {
    whyNowParts.push("Ton énergie semble suffisante pour cette activité.");
  }

  const altText =
    alternatives.length > 0
      ? `Sinon, ${alternatives
          .map((alt) => alt.title.toLowerCase())
          .join(" ou ")} reste possible.`
      : "Tu peux aussi garder ce temps libre.";

  const whyNotOther = `Je ne te propose pas autre chose en priorité parce que ${positiveFactors
    .slice(0, 3)
    .map((factor) => factor.label)
    .join(", ")}. ${altText}`;

  const remaining =
    slot && proposal.durationMinutes > 0
      ? `Après cette séance, il te restera environ ${formatStudyMinutesLabel(
          Math.max(0, slot.durationMinutes - proposal.durationMinutes),
        )} libres.`
      : "";

  const fullText = [
    whyParts.join(" "),
    whyNowParts.join(" "),
    whyNotOther,
    remaining,
    "Tu restes libre d'accepter, modifier ou refuser.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    why: whyParts.join(" "),
    whyNow: whyNowParts.join(" "),
    whyNotOther,
    fullText,
  };
}

function baseScoreFromPriority(priority: LifeProposal["priority"]): number {
  if (priority === "high") return 78;
  if (priority === "medium") return 62;
  return 48;
}

export function reasonAboutLifeProposal(input: LifeReasonerInput): LifeDecision {
  const factors = buildFactors(input);
  const alternatives = buildAlternatives(input);
  const confidence = computeConfidence(
    factors,
    baseScoreFromPriority(input.proposal.priority),
  );
  const explanation = buildExplanation(input, factors, alternatives);

  return {
    proposalId: input.proposal.id,
    category: input.proposal.category,
    reason: input.proposal.reason,
    priority: input.proposal.priority,
    confidence,
    factors,
    alternatives,
    explanation,
  };
}

export function enrichProposalWithDecision(
  proposal: LifeProposal,
  decision: LifeDecision,
): LifeProposal {
  return {
    ...proposal,
    priority: decision.priority,
    reason: decision.reason,
    confidence: decision.confidence,
    confidenceFactors: decision.factors,
    explanation: decision.explanation.fullText,
    decision,
  };
}

export function reasonAboutProposals({
  proposals,
  lifeContext,
  planningContext,
  habitProfile,
  statistics,
  tasks,
  slot,
}: {
  proposals: LifeProposal[];
  lifeContext: LifeContext;
  planningContext?: PlanningContext;
  habitProfile?: HabitProfile | null;
  statistics?: PeriodStatistics | null;
  tasks?: TaskRecord[];
  slot?: ScoredFreeSlot;
}): LifeProposal[] {
  return proposals.map((proposal) => {
    const decision = reasonAboutLifeProposal({
      proposal,
      slot,
      lifeContext,
      planningContext,
      habitProfile,
      statistics,
      tasks,
      alternativeProposals: proposals.filter((item) => item.id !== proposal.id),
    });
    return enrichProposalWithDecision(proposal, decision);
  });
}
