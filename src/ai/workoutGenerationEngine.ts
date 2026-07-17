import {
  COOLDOWN_TEMPLATES,
  EXERCISE_LIBRARY,
  WARMUP_TEMPLATES,
  pickExerciseForLevel,
} from "../data/workoutExerciseLibrary";
import type { SportPreferences } from "../types/sportPreferences";
import { DEFAULT_SPORT_PREFERENCES } from "../types/sportPreferences";
import type {
  WorkoutBlock,
  WorkoutExerciseDetail,
  WorkoutIntensity,
  WorkoutLevel,
  WorkoutSession,
  WorkoutSessionType,
} from "../types/workoutSession";
import {
  resolveRecommendedSportDuration,
  snapSportDuration,
} from "../lib/planning/resolveSportDuration";

export { adaptWorkoutSessionDuration } from "../lib/planning/adaptWorkoutSessionDuration";
import {
  WORKOUT_LEVEL_LABELS,
  WORKOUT_SESSION_TYPE_LABELS,
} from "../types/workoutSession";

export type WorkoutGenerationInput = {
  durationMinutes: number;
  level?: WorkoutLevel;
  type?: WorkoutSessionType;
  energy?: string;
  fatigueLevel?: string;
  slotHour: number;
  equipment?: string[];
  preferences?: SportPreferences;
  recentTypes?: WorkoutSessionType[];
  recentSeeds?: string[];
  generationSeed?: string;
  forceDifferent?: boolean;
};

const INTENSE_TYPES: WorkoutSessionType[] = ["hiit", "tabata", "run", "cardio"];

const ZONE_BY_TYPE: Record<WorkoutSessionType, string[]> = {
  full_body: ["legs", "chest", "core"],
  upper_body: ["chest", "arms", "shoulders"],
  lower_body: ["legs", "glutes"],
  core: ["core", "back"],
  mobility: ["mobility", "hips", "shoulders"],
  yoga: ["mobility", "core"],
  cardio: ["cardio"],
  hiit: ["cardio", "legs"],
  tabata: ["cardio", "full"],
  run: ["cardio", "legs"],
  active_walk: ["cardio", "legs"],
  recovery: ["mobility"],
  stretching: ["mobility", "back"],
};

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function snapDuration(minutes: number, type: WorkoutSessionType): number {
  return snapSportDuration(minutes, type);
}

function resolveIntensity(
  input: WorkoutGenerationInput,
  type: WorkoutSessionType,
): WorkoutIntensity {
  const pref = input.preferences?.intensity ?? "moderate";
  if (input.slotHour >= 21 || input.energy === "low" || input.fatigueLevel === "high") {
    return "gentle";
  }
  if (INTENSE_TYPES.includes(type) && (input.fatigueLevel === "medium" || input.energy === "low")) {
    return "gentle";
  }
  if (INTENSE_TYPES.includes(type) && pref === "dynamic") {
    return "moderate";
  }
  return pref;
}

function isTypeBlocked(
  type: WorkoutSessionType,
  input: WorkoutGenerationInput,
): boolean {
  const prefs = input.preferences ?? DEFAULT_SPORT_PREFERENCES;
  if (prefs.avoidedTypes.includes(type)) return true;
  if (input.slotHour >= 21 && INTENSE_TYPES.includes(type)) return true;
  if (input.fatigueLevel === "high" && (type === "hiit" || type === "tabata")) return true;
  if (input.energy === "low" && (type === "hiit" || type === "tabata" || type === "run")) {
    return true;
  }
  return false;
}

function pickSessionType(input: WorkoutGenerationInput, seed: number): WorkoutSessionType {
  if (input.type && !isTypeBlocked(input.type, input)) {
    return input.type;
  }

  const prefs = input.preferences ?? DEFAULT_SPORT_PREFERENCES;
  const recent = new Set(input.recentTypes ?? []);

  let candidates: WorkoutSessionType[] = [
    ...(prefs.preferredTypes.length > 0 ? prefs.preferredTypes : []),
    "full_body",
    "mobility",
    "active_walk",
    "core",
    "lower_body",
    "upper_body",
    "yoga",
    "recovery",
    "stretching",
  ];

  candidates = [...new Set(candidates)].filter((type) => !isTypeBlocked(type, input));

  if (input.slotHour >= 20) {
    candidates = candidates.filter((type) =>
      ["mobility", "yoga", "recovery", "stretching", "core", "full_body"].includes(type),
    );
  }

  if (input.recentTypes?.length) {
    const fresh = candidates.filter((type) => !recent.has(type));
    if (fresh.length > 0) candidates = fresh;
  }

  if (candidates.length === 0) {
    return input.slotHour >= 21 ? "mobility" : "full_body";
  }

  return candidates[seed % candidates.length];
}

function allocateMinutes(total: number): {
  warmup: number;
  main: number;
  cooldown: number;
} {
  const warmup = total <= 10 ? 2 : total <= 15 ? 3 : 4;
  const cooldown = total <= 10 ? 2 : total <= 15 ? 2 : 3;
  const main = Math.max(3, total - warmup - cooldown);
  return { warmup, main, cooldown };
}

function buildCircuitBlock(
  type: WorkoutSessionType,
  level: WorkoutLevel,
  mainMinutes: number,
  seed: number,
  _recentSeeds: string[] = [],
): WorkoutBlock {
  const zoneFilter = ZONE_BY_TYPE[type];
  let pool = EXERCISE_LIBRARY.filter((item) =>
    item.targetAreas.some((area) => zoneFilter.includes(area)),
  );
  if (pool.length < 3) pool = EXERCISE_LIBRARY;

  const start = seed % pool.length;
  const picked = [];
  for (let i = 0; i < 4; i += 1) {
    picked.push(pool[(start + i) % pool.length]);
  }

  const roundCount =
    mainMinutes >= 20 ? (level === "advanced" ? 4 : 3) : mainMinutes >= 12 ? 2 : 2;

  return {
    label: `Circuit — ${roundCount} tours`,
    exercises: picked.map((template) => pickExerciseForLevel(template, level)),
    rounds: roundCount,
    restSeconds: level === "beginner" ? 40 : 30,
  };
}

function buildContinuousBlock(
  type: WorkoutSessionType,
  mainMinutes: number,
): WorkoutBlock {
  const label =
    type === "run"
      ? "Course continue"
      : type === "active_walk"
        ? "Marche active"
        : type === "yoga"
          ? "Enchaînement yoga"
          : "Séquence continue";

  return {
    label,
    exercises: [
      {
        name: WORKOUT_SESSION_TYPE_LABELS[type],
        durationSeconds: mainMinutes * 60,
        instructions: "Rythme confortable, respiration régulière.",
      },
    ],
  };
}

function buildSessionBlocks(
  type: WorkoutSessionType,
  level: WorkoutLevel,
  mainMinutes: number,
  seed: number,
  recentSeeds: string[],
): WorkoutBlock[] {
  if (["run", "active_walk", "yoga", "recovery", "stretching"].includes(type)) {
    return [buildContinuousBlock(type, mainMinutes)];
  }
  if (type === "hiit" || type === "tabata") {
    const work = type === "tabata" ? 20 : 30;
    const rest = type === "tabata" ? 10 : 20;
    const rounds = Math.min(8, Math.max(4, Math.floor((mainMinutes * 60) / (work + rest))));
    return [
      {
        label: type === "tabata" ? "Tabata" : "HIIT",
        exercises: [
          pickExerciseForLevel(EXERCISE_LIBRARY[seed % EXERCISE_LIBRARY.length], level),
          pickExerciseForLevel(EXERCISE_LIBRARY[(seed + 2) % EXERCISE_LIBRARY.length], level),
        ],
        rounds,
        workSeconds: work,
        restSeconds: rest,
      },
    ];
  }
  return [buildCircuitBlock(type, level, mainMinutes, seed, recentSeeds)];
}

function trimWarmupCooldown(
  warmup: WorkoutExerciseDetail[],
  cooldown: WorkoutExerciseDetail[],
  warmupMin: number,
  cooldownMin: number,
): { warmup: WorkoutExerciseDetail[]; cooldown: WorkoutExerciseDetail[] } {
  const warmupBudget = warmupMin * 60;
  const cooldownBudget = cooldownMin * 60;
  let warmTotal = 0;
  let coolTotal = 0;
  const warm: WorkoutExerciseDetail[] = [];
  const cool: WorkoutExerciseDetail[] = [];

  for (const item of warmup) {
    const cost = item.durationSeconds ?? 30;
    if (warmTotal + cost > warmupBudget) break;
    warm.push(item);
    warmTotal += cost;
  }

  for (const item of cooldown) {
    const cost = item.durationSeconds ?? 30;
    if (coolTotal + cost > cooldownBudget) break;
    cool.push(item);
    coolTotal += cost;
  }

  return { warmup: warm.length ? warm : warmup.slice(0, 2), cooldown: cool.length ? cool : cooldown.slice(0, 2) };
}

export function generateWorkoutSession(input: WorkoutGenerationInput): WorkoutSession {
  const level = input.level ?? input.preferences?.level ?? "intermediate";
  const baseSeed = input.generationSeed ?? `${input.durationMinutes}-${input.slotHour}-${level}`;
  const seedOffset = input.forceDifferent ? (input.recentSeeds?.length ?? 0) + 1 : 0;
  const seed = hashSeed(`${baseSeed}-${seedOffset}-${input.recentSeeds?.join(",") ?? ""}`);
  const type = pickSessionType(input, seed);
  const durationMinutes = input.durationMinutes
    ? snapDuration(input.durationMinutes, type)
    : resolveRecommendedSportDuration({
        slotMinutes: 40,
        energy: input.energy,
        type,
        preferredMinutes: input.preferences?.preferredDurationMinutes ?? 25,
      });
  const intensity = resolveIntensity(input, type);
  const { warmup: warmMin, main: mainMin, cooldown: coolMin } =
    allocateMinutes(durationMinutes);

  const { warmup, cooldown } = trimWarmupCooldown(
    WARMUP_TEMPLATES[level],
    COOLDOWN_TEMPLATES,
    warmMin,
    coolMin,
  );

  const blocks = buildSessionBlocks(
    type,
    level,
    mainMin,
    seed,
    input.recentSeeds ?? [],
  );

  const equipment =
    input.equipment?.length
      ? input.equipment.join(", ")
      : (input.preferences?.availableEquipment.length ?? 0) > 0
        ? input.preferences!.availableEquipment.join(", ")
        : "Sans matériel";

  const generationSeed = `${type}-${level}-${durationMinutes}-${seed}-${seedOffset}`;
  const title = `${WORKOUT_SESSION_TYPE_LABELS[type]} — ${durationMinutes} min`;
  const safetyNotes: string[] = [];

  if (input.slotHour >= 21) {
    safetyNotes.push("Fin de journée — séance volontairement douce.");
  }
  if (input.fatigueLevel === "high" || input.energy === "low") {
    safetyNotes.push("Adapte l'intensité à ton énergie du moment.");
  }

  const reason = buildGeneratedReason({
    durationMinutes,
    level,
    slotHour: input.slotHour,
    energy: input.energy,
    type,
  });

  const flatExercises = blocks.flatMap((block) => block.exercises);

  return {
    id: `workout-${generationSeed}`,
    title,
    type,
    level,
    durationMinutes,
    estimatedCalories: Math.round(durationMinutes * (intensity === "gentle" ? 4 : 6)),
    equipment,
    intensity,
    warmup,
    blocks,
    exercises: flatExercises,
    rounds: blocks,
    cooldown,
    instructions: "Échauffement, circuit ou séquence, puis retour au calme — le tout dans la durée prévue.",
    alternatives: [
      "Réduire d'un tour si tu manques de souffle.",
      "Choisir la variation facile indiquée pour chaque exercice.",
    ],
    safetyNotes,
    safetyNote: safetyNotes[0],
    generatedReason: reason,
    generationSeed,
    createdAt: new Date().toISOString(),
  };
}

function buildGeneratedReason({
  durationMinutes,
  level,
  slotHour,
  energy,
  type,
}: {
  durationMinutes: number;
  level: WorkoutLevel;
  slotHour: number;
  energy?: string;
  type: WorkoutSessionType;
}): string {
  const levelLabel = WORKOUT_LEVEL_LABELS[level].toLowerCase();
  if (slotHour >= 21) {
    return `Je te propose cette séance ${levelLabel} car il est tard — ${WORKOUT_SESSION_TYPE_LABELS[type].toLowerCase()} et retour au calme inclus.`;
  }
  if (energy === "low") {
    return `Je te propose cette séance courte ${levelLabel} car ton énergie est limitée — ${durationMinutes} minutes réalistes.`;
  }
  return `Je te propose cette séance ${levelLabel} car tu disposes de ${durationMinutes} minutes et que ton énergie est correcte.`;
}

/** Compatibilité moteur Sprint 4.4 */
export function generateLegacySportSession(args: {
  durationMinutes: number;
  sportType: string;
  intensity: WorkoutIntensity;
  equipment?: string;
  slotHour: number;
  afterWorkEnergy?: string;
  fatigueLevel?: string;
  generationSeed?: string;
  preferences?: SportPreferences;
  recentSeeds?: string[];
  forceDifferent?: boolean;
}): WorkoutSession {
  const typeMap: Record<string, WorkoutSessionType> = {
    walk: "active_walk",
    run: "run",
    mobility: "mobility",
    yoga: "yoga",
    strength: "full_body",
    cardio: "cardio",
    dance: "cardio",
    other: "full_body",
  };

  return generateWorkoutSession({
    durationMinutes: args.durationMinutes,
    type: typeMap[args.sportType] ?? "full_body",
    slotHour: args.slotHour,
    energy: args.afterWorkEnergy,
    fatigueLevel: args.fatigueLevel,
    equipment: args.equipment ? [args.equipment] : [],
    preferences: args.preferences,
    generationSeed: args.generationSeed,
    recentSeeds: args.recentSeeds,
    forceDifferent: args.forceDifferent,
  });
}

export function sessionsAreSimilar(a: WorkoutSession, b: WorkoutSession): boolean {
  return (
    a.type === b.type &&
    a.generationSeed === b.generationSeed &&
    a.title === b.title
  );
}
