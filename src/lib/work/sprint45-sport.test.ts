import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  generateWorkoutSession,
  sessionsAreSimilar,
} from "../../ai/workoutGenerationEngine";
import {
  attachSportProposalsToTimeline,
  buildSportProposalForEntry,
  shouldAttachSportProposal,
} from "../planning/sportProposalAttachment";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { DEFAULT_SPORT_PREFERENCES } from "../../types/sportPreferences";

const root = join(process.cwd(), "src");
const date = "2026-07-20";

function readSrc(fragment: string): string {
  return readFileSync(join(root, fragment), "utf8");
}

function freeSlotEntry(minutes: number, hour = 14): DayTimelineEntry {
  const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  const end = new Date(start.getTime() + minutes * 60_000);
  return {
    id: `free-${hour}-${minutes}`,
    visualType: "free",
    title: "Temps libre",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    activityType: "free",
  };
}

describe("Sprint 4.5 complement — propositions sportives", () => {
  it("A. proposition sportive directe dans la timeline", () => {
    const timeline = attachSportProposalsToTimeline({
      entries: [freeSlotEntry(30)],
      lifeContext: {
        sportPossible: true,
        energyPrediction: "medium",
        proposals: [{ category: "sport", durationMinutes: 20, label: "Sport" }],
      } as never,
    });

    expect(timeline[0].proposedWorkoutSession).toBeDefined();
    expect(timeline[0].title).toBe("Activité sportive proposée");
    expect(readSrc("components/planning/SportProposalCard.tsx")).toContain(
      "Activité sportive proposée",
    );
  });

  it("B. séance débutant", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "beginner",
      slotHour: 14,
    });
    expect(session.level).toBe("beginner");
    expect(session.warmup.length).toBeGreaterThan(0);
  });

  it("C. séance intermédiaire", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 14,
    });
    expect(session.level).toBe("intermediate");
  });

  it("D. séance confirmée", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "advanced",
      slotHour: 14,
    });
    expect(session.level).toBe("advanced");
  });

  it("E. séance 10 minutes minimum", () => {
    const session = generateWorkoutSession({
      durationMinutes: 5,
      level: "intermediate",
      slotHour: 14,
    });
    expect(session.durationMinutes).toBe(10);
  });

  it("F. séance 15 minutes", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 14,
    });
    expect(session.durationMinutes).toBe(15);
  });

  it("G. séance 30 minutes", () => {
    const session = generateWorkoutSession({
      durationMinutes: 30,
      level: "intermediate",
      slotHour: 14,
    });
    expect(session.durationMinutes).toBe(30);
  });

  it("H. durée totale respectée", () => {
    for (const minutes of [10, 15, 20, 25, 30, 35, 40]) {
      const session = generateWorkoutSession({
        durationMinutes: minutes,
        level: "intermediate",
        slotHour: 14,
      });
      expect(session.durationMinutes).toBeLessThanOrEqual(minutes);
      expect(session.warmup.length).toBeGreaterThan(0);
      expect(session.cooldown.length).toBeGreaterThan(0);
    }
  });

  it("I. séance douce tard le soir", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 21,
    });
    expect(session.intensity).toBe("gentle");
    expect(["hiit", "tabata", "run"]).not.toContain(session.type);
  });

  it("J. pas de HIIT si fatigue élevée", () => {
    const session = generateWorkoutSession({
      durationMinutes: 20,
      level: "intermediate",
      slotHour: 14,
      fatigueLevel: "high",
      type: "hiit",
    });
    expect(session.type).not.toBe("hiit");
    expect(session.type).not.toBe("tabata");
  });

  it("K. variation après autre séance", () => {
    const first = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 14,
      generationSeed: "seed-1",
    });
    const second = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 14,
      recentSeeds: [first.generationSeed],
      forceDifferent: true,
      generationSeed: "seed-2",
    });
    expect(sessionsAreSimilar(first, second)).toBe(false);
  });

  it("L. pas de doublon calendar_item avant acceptation", () => {
    const hook = readSrc("hooks/useDayPlan.ts");
    expect(hook).toContain("sportProposalOverrides");
    expect(hook).toContain("regenerateSportProposal");
    expect(hook.indexOf("regenerateSportProposal")).toBeLessThan(
      hook.indexOf("acceptSportProposalEntry"),
    );
  });

  it("M. persistance après acceptation", () => {
    const service = readSrc("services/sportProposalService.ts");
    expect(service).toContain("workoutSession: session");
    expect(service).toContain("recordTaskActivityEvent");
  });

  it("N. matériel respecté", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 14,
      preferences: {
        ...DEFAULT_SPORT_PREFERENCES,
        availableEquipment: ["Tapis", "Élastiques"],
      },
    });
    expect(session.equipment).toContain("Tapis");
    expect(session.equipment).toContain("Élastiques");
  });

  it("O. exercices alternatifs", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "intermediate",
      slotHour: 14,
    });
    const withVariations = session.blocks
      .flatMap((block) => block.exercises)
      .some((exercise) => exercise.easierVariation || exercise.harderVariation);
    expect(withVariations).toBe(true);
  });

  it("P. historique évite répétition immédiate", () => {
    const entry = freeSlotEntry(25);
    const first = buildSportProposalForEntry({ entry, generationSeed: "hist-1" });
    const second = buildSportProposalForEntry({
      entry,
      recentSeeds: [first.generationSeed],
      forceDifferent: true,
      generationSeed: "hist-2",
    });
    expect(second.generationSeed).not.toBe(first.generationSeed);
  });

  it("Q. bouton autre séance visible", () => {
    const card = readSrc("components/planning/SportProposalCard.tsx");
    expect(card).toContain("Proposer une autre séance");
    const timeline = readSrc("components/planning/DayTimeline.tsx");
    expect(timeline).toContain("SportProposalCard");
  });

  it("R. séance complète après F5", () => {
    const timeline = readSrc("lib/planning/displayedDayTimeline.ts");
    expect(timeline).toContain("proposedWorkoutSession");
    expect(readSrc("components/planning/WorkoutSessionPanel.tsx")).toContain(
      "Échauffement",
    );
    expect(
      shouldAttachSportProposal({
        entry: freeSlotEntry(20),
        lifeContext: { sportPossible: true, proposals: [] } as never,
      }),
    ).toBe(true);
  });
});

describe("Sprint 4.5 complement — migration sport_settings", () => {
  it("migration 00015 sport_settings", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/00015_sport_settings.sql"),
      "utf8",
    );
    expect(migration).toContain("sport_settings");
  });
});
