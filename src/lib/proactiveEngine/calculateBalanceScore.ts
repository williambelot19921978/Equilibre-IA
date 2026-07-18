import {
  DEFAULT_MINIMUM_PERSONAL_TIME_MINUTES,
  DEFAULT_MINIMUM_SLEEP_HOURS,
  DEFAULT_PREFERRED_DAILY_LOAD_MINUTES,
  LONG_TRAVEL_MINUTES_WARNING,
  PERSONAL_TIME_BONUS_THRESHOLD_MINUTES,
  POSTPONEMENT_THRESHOLDS,
  SCORE_BASE,
  SCORE_BONUSES,
  SCORE_PENALTIES,
  SPORT_BONUS_MINUTES,
} from "./constants";
import { detectOverload } from "./detectOverload";
import { detectRepeatedPostponements } from "./detectRepeatedPostponements";
import { clampScore, resolveBalanceLevel } from "./explainBalanceScore";
import type {
  BalanceScoreFactor,
  BalanceScoreResult,
  DayAnalysisInput,
} from "./types";

function addFactor(
  factors: BalanceScoreFactor[],
  factor: BalanceScoreFactor,
): void {
  factors.push(factor);
}

export function calculateBalanceScore(input: DayAnalysisInput): BalanceScoreResult {
  const factors: BalanceScoreFactor[] = [];
  let score = SCORE_BASE;

  const prefs = input.userPreferences ?? {};
  const minimumSleepHours = prefs.minimumSleepHours ?? DEFAULT_MINIMUM_SLEEP_HOURS;
  const minimumPersonalTime =
    prefs.minimumPersonalTimeMinutes ?? DEFAULT_MINIMUM_PERSONAL_TIME_MINUTES;
  const preferredLoad =
    prefs.preferredDailyLoadMinutes ?? DEFAULT_PREFERRED_DAILY_LOAD_MINUTES;

  const overload = detectOverload(input);
  const postponements = detectRepeatedPostponements(input);

  for (const reason of overload.reasons) {
    const penalty =
      reason.severity === "critical"
        ? SCORE_PENALTIES.overloadCritical
        : SCORE_PENALTIES.overloadWarning;
    addFactor(factors, {
      code: reason.code,
      label: "Surcharge",
      impact: -penalty,
      explanation: reason.explanation,
    });
    score -= penalty;
  }

  const sleepHours = input.sleep?.actualHours ?? input.sleep?.plannedHours;
  if (sleepHours != null && sleepHours < minimumSleepHours) {
    addFactor(factors, {
      code: "insufficient_sleep",
      label: "Sommeil",
      impact: -SCORE_PENALTIES.insufficientSleep,
      explanation: `Sommeil prévu d'environ ${sleepHours} h (minimum recommandé : ${minimumSleepHours} h).`,
    });
    score -= SCORE_PENALTIES.insufficientSleep;
  }

  const personalTime = input.personalTimeMinutes ?? 0;
  if (personalTime < minimumPersonalTime) {
    addFactor(factors, {
      code: "no_personal_time",
      label: "Temps personnel",
      impact: -SCORE_PENALTIES.noPersonalTime,
      explanation: "Peu de temps personnel prévu aujourd'hui.",
    });
    score -= SCORE_PENALTIES.noPersonalTime;
  } else if (personalTime >= PERSONAL_TIME_BONUS_THRESHOLD_MINUTES) {
    addFactor(factors, {
      code: "personal_time_ok",
      label: "Temps personnel",
      impact: SCORE_BONUSES.personalTime,
      explanation: "Du temps personnel est prévu dans la journée.",
    });
    score += SCORE_BONUSES.personalTime;
  }

  if (overload.highPriorityCount > 3) {
    addFactor(factors, {
      code: "high_priority_overload",
      label: "Priorités",
      impact: -SCORE_PENALTIES.highPriorityOverload,
      explanation: "Plusieurs tâches prioritaires sont regroupées aujourd'hui.",
    });
    score -= SCORE_PENALTIES.highPriorityOverload;
  }

  const travelMinutes = input.travelMinutes ?? 0;
  if (travelMinutes >= LONG_TRAVEL_MINUTES_WARNING) {
    addFactor(factors, {
      code: "long_travel",
      label: "Déplacements",
      impact: -SCORE_PENALTIES.longTravel,
      explanation: `Environ ${Math.round(travelMinutes / 60)} h de déplacements prévus.`,
    });
    score -= SCORE_PENALTIES.longTravel;
  }

  if (postponements.maxCount >= POSTPONEMENT_THRESHOLDS.infoMin) {
    addFactor(factors, {
      code: "repeated_postponement",
      label: "Reports",
      impact: -SCORE_PENALTIES.repeatedPostponement,
      explanation: "Certaines tâches ont été reportées plusieurs fois.",
    });
    score -= SCORE_PENALTIES.repeatedPostponement;
  }

  if (
    overload.lastActivityEndMinutes !== null &&
    overload.reasons.some((reason) => reason.code === "late_day_end")
  ) {
    addFactor(factors, {
      code: "late_day_end_penalty",
      label: "Fin de journée",
      impact: -SCORE_PENALTIES.lateDayEnd,
      explanation: "La journée se termine tardivement.",
    });
    score -= SCORE_PENALTIES.lateDayEnd;
  }

  if (
    overload.reasons.some((reason) => reason.code === "late_activity_incompatible_with_sleep")
  ) {
    addFactor(factors, {
      code: "late_activity_sleep_penalty",
      label: "Sommeil",
      impact: -SCORE_PENALTIES.lateActivityBeforeSleep,
      explanation: "Une activité tardive peut réduire le repos.",
    });
    score -= SCORE_PENALTIES.lateActivityBeforeSleep;
  }

  const sportMinutes = input.sportMinutes ?? 0;
  if (sportMinutes >= SPORT_BONUS_MINUTES) {
    addFactor(factors, {
      code: "sport_planned",
      label: "Sport",
      impact: SCORE_BONUSES.sport,
      explanation: "Une séance de sport est prévue.",
    });
    score += SCORE_BONUSES.sport;
  }

  if (
    overload.totalPlannedMinutes > 0 &&
    overload.totalPlannedMinutes <= preferredLoad &&
    !overload.overloaded
  ) {
    addFactor(factors, {
      code: "compatible_load",
      label: "Charge",
      impact: SCORE_BONUSES.compatibleLoad,
      explanation: "La charge planifiée correspond à tes préférences.",
    });
    score += SCORE_BONUSES.compatibleLoad;
  }

  if (
    overload.reasons.every((reason) => reason.code !== "missing_breaks") &&
    overload.totalPlannedMinutes >= 240
  ) {
    addFactor(factors, {
      code: "realistic_breaks",
      label: "Pauses",
      impact: SCORE_BONUSES.realisticBreaks,
      explanation: "Des pauses raisonnables sont prévues.",
    });
    score += SCORE_BONUSES.realisticBreaks;
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    level: resolveBalanceLevel(finalScore),
    factors,
  };
}
