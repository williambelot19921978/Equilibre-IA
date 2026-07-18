/** Seuils du Score Équilibre (0–100). */
export const BALANCE_LEVEL_THRESHOLDS = {
  balancedMin: 80,
  busyMin: 55,
} as const;

export const SCORE_BASE = 100;
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/** Charge planifiée — au-delà, surcharge probable. */
export const DEFAULT_PREFERRED_DAILY_LOAD_MINUTES = 480;
export const OVERLOAD_PLANNED_MINUTES_WARNING = 540;
export const OVERLOAD_PLANNED_MINUTES_CRITICAL = 630;

/** Sommeil */
export const DEFAULT_MINIMUM_SLEEP_HOURS = 7;
export const INSUFFICIENT_SLEEP_HOURS_WARNING = 6;

/** Temps personnel */
export const DEFAULT_MINIMUM_PERSONAL_TIME_MINUTES = 60;
export const PERSONAL_TIME_BONUS_THRESHOLD_MINUTES = 90;

/** Sport */
export const DEFAULT_MINIMUM_SPORT_MINUTES_PER_WEEK = 90;
export const SPORT_BONUS_MINUTES = 20;

/** Priorités et pauses */
export const MAX_HIGH_PRIORITY_TASKS = 3;
export const HIGH_PRIORITY_THRESHOLD = 3;
export const MIN_BREAK_MINUTES = 15;
export const MIN_BREAK_GAP_MINUTES = 120;

/** Fin de journée (minutes depuis minuit, UTC pour cohérence tests). */
export const LATE_DAY_END_MINUTES = 22 * 60;
export const LATE_ACTIVITY_BEFORE_SLEEP_MINUTES = 21 * 60;

/** Déplacements */
export const LONG_TRAVEL_MINUTES_WARNING = 90;

/** Reports répétés */
export const POSTPONEMENT_THRESHOLDS = {
  infoMin: 2,
  warningMin: 3,
  criticalMin: 5,
} as const;

/** Pénalités et bonus du score */
export const SCORE_PENALTIES = {
  overloadCritical: 25,
  overloadWarning: 12,
  insufficientSleep: 18,
  noPersonalTime: 10,
  highPriorityOverload: 8,
  longTravel: 6,
  repeatedPostponement: 5,
  lateDayEnd: 10,
  lateActivityBeforeSleep: 8,
  overlap: 15,
  noBreaks: 8,
} as const;

export const SCORE_BONUSES = {
  personalTime: 5,
  sport: 5,
  compatibleLoad: 5,
  realisticBreaks: 3,
} as const;

/** Insights */
export const MAX_PROACTIVE_INSIGHTS = 3;
