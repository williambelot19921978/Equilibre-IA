import { describe, expect, it, vi } from "vitest";

import { resolveActions } from "./actionResolver";
import { extractEntities, normalizeNlpText } from "./entityExtractor";
import {
  createInitialConversationState,
  processConversationTurn,
} from "./conversationEngine";
import { shouldShowConversationBar } from "../../lib/navigation/conversationAccess";
import { detectIntent, parseUserMessage } from "./intentEngine";

const REF = "2026-07-15";

function parse(text: string) {
  return parseUserMessage({ text, referenceDate: REF, childNames: ["Peter"] });
}

describe("Sprint 3.1 — entityExtractor", () => {
  it("01 — demain", () => {
    const entities = extractEntities({ text: "Je travaille demain", referenceDate: REF });
    expect(entities.dates).toContain("2026-07-16");
  });

  it("02 — après-demain", () => {
    const entities = extractEntities({ text: "Sport après-demain", referenceDate: REF });
    expect(entities.dates).toContain("2026-07-17");
  });

  it("03 — ce soir", () => {
    const entities = extractEntities({ text: "Prier ce soir", referenceDate: REF });
    expect(entities.dates).toContain(REF);
  });

  it("04 — vendredi", () => {
    const entities = extractEntities({ text: "Peter dort chez mamie vendredi", referenceDate: REF });
    expect(entities.weekday).toBe("friday");
  });

  it("05 — période vacances août", () => {
    const entities = extractEntities({
      text: "Je suis en vacances du 10 au 18 août",
      referenceDate: REF,
    });
    expect(entities.dateRange?.start).toBe("2026-08-10");
    expect(entities.dateRange?.end).toBe("2026-08-18");
    expect(entities.scope).toBe("period");
  });

  it("06 — durée 45 minutes", () => {
    const entities = extractEntities({
      text: "Je veux courir 45 minutes demain",
      referenceDate: REF,
    });
    expect(entities.durationMinutes).toBe(45);
  });

  it("07 — une heure", () => {
    const entities = extractEntities({
      text: "Lire une heure",
      referenceDate: REF,
    });
    expect(entities.durationMinutes).toBe(60);
  });

  it("08 — finir plus tard", () => {
    const entities = extractEntities({
      text: "Je finis une heure plus tard",
      referenceDate: REF,
    });
    expect(entities.durationDeltaMinutes).toBe(60);
  });

  it("09 — enfant Peter", () => {
    const entities = extractEntities({
      text: "Peter dort chez mamie vendredi",
      referenceDate: REF,
      childNames: ["Peter"],
    });
    expect(entities.childName).toBe("Peter");
    expect(entities.location).toMatch(/mamie/);
  });

  it("10 — récurrent mercredis", () => {
    const entities = extractEntities({
      text: "Tous les mercredis je suis en repos",
      referenceDate: REF,
    });
    expect(entities.recurring).toBe(true);
    expect(entities.weekdays).toContain("wednesday");
  });
});

describe("Sprint 3.1 — intentEngine", () => {
  it("11 — travail demain", () => {
    expect(parse("Je travaille demain").intent).toBe("modify_work");
  });

  it("12 — vacances", () => {
    expect(parse("Je suis en vacances du 10 au 18 août").intent).toBe(
      "modify_vacation",
    );
  });

  it("13 — enfant contexte", () => {
    expect(parse("Peter dort chez mamie vendredi").intent).toBe("modify_children");
  });

  it("14 — sport course", () => {
    expect(parse("Je veux courir 45 minutes demain").intent).toBe("modify_sport");
  });

  it("15 — fin travail plus tard", () => {
    expect(parse("Je finis une heure plus tard").intent).toBe("modify_work");
  });

  it("16 — fatigue", () => {
    expect(parse("Je suis fatigué").intent).toBe("declare_fatigue");
  });

  it("17 — soirée tranquille", () => {
    expect(parse("Je veux une soirée tranquille").intent).toBe("quiet_evening");
  });

  it("18 — prière", () => {
    expect(parse("Je veux prier ce soir").intent).toBe("modify_spiritual");
  });

  it("19 — lecture", () => {
    expect(parse("Je veux lire 30 minutes").intent).toBe("modify_study");
  });

  it("20 — supprimer sport", () => {
    expect(parse("Supprime mon sport").intent).toBe("modify_sport");
  });

  it("21 — déplacement William", () => {
    expect(parse("William est en déplacement").intent).toBe("modify_travel");
  });

  it("22 — confirmation oui", () => {
    expect(parse("oui").intent).toBe("confirm");
  });

  it("23 — annulation non", () => {
    expect(parse("non").intent).toBe("cancel");
  });

  it("24 — suggestion", () => {
    expect(parse("Que me proposes-tu ?").intent).toBe("request_suggestion");
  });

  it("25 — question type journée", () => {
    expect(parse("Quel type de journée aujourd'hui ?").intent).toBe("ask_question");
  });
});

describe("Sprint 3.1 — actionResolver", () => {
  it("26 — action vacances", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je suis en vacances du 10 au 18 août"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateVacationPeriod")).toBe(true);
  });

  it("27 — action travail demain", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je travaille demain"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "MarkWorkDay")).toBe(true);
  });

  it("28 — action repos ponctuel", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je suis en repos demain"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "MarkRestDay")).toBe(true);
  });

  it("29 — action sport avec durée", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux courir 45 minutes demain"),
      referenceDate: REF,
    });
    const workout = actions.find((a) => a.type === "CreateWorkoutTask");
    expect(workout?.payload.durationMinutes).toBe(45);
  });

  it("30 — action prière", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux prier ce soir"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreatePrayerBlock")).toBe(true);
  });

  it("31 — action lecture", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux lire 30 minutes"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateReadingBlock")).toBe(true);
  });

  it("32 — supprimer sport demande confirmation", () => {
    const { actions } = resolveActions({
      parseResult: parse("Supprime mon sport"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "DeleteSportTasks" && a.requiresConfirmation)).toBe(
      true,
    );
  });

  it("33 — fatigue réduit remplissage", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je suis fatiguée"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "ReduceFillRatio")).toBe(true);
  });

  it("34 — soirée tranquille", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux une soirée tranquille"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "QuietEvening")).toBe(true);
  });

  it("35 — enfant chez mamie", () => {
    const { actions } = resolveActions({
      parseResult: parse("Peter dort chez mamie vendredi"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateChildContextPeriod")).toBe(true);
  });

  it("36 — fin plus tard aujourd'hui", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je finis une heure plus tard"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "UpdateWorkScheduleToday")).toBe(true);
  });

  it("37 — récurrent repos propose mémoire", () => {
    const resolved = resolveActions({
      parseResult: parse("Tous les mercredis je suis en repos"),
      referenceDate: REF,
    });
    expect(resolved.memoryProposal).toBeDefined();
    expect(resolved.memoryProposal?.prompt).toMatch(/rythme habituel/i);
  });

  it("38 — déplacement", () => {
    const { actions } = resolveActions({
      parseResult: parse("William est en déplacement cette semaine"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateWorkTravelPeriod")).toBe(true);
  });

  it("39 — chaque action a une raison", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je travaille demain"),
      referenceDate: REF,
    });
    expect(actions.every((a) => a.reason.length > 0)).toBe(true);
  });

  it("40 — replan après modification", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je travaille demain"),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "RebuildDay")).toBe(true);
  });
});

describe("Sprint 3.1 — conversationEngine", () => {
  const runtime = {
    userId: "user-1",
    referenceDate: REF,
    childNames: ["Peter"],
    tasks: [],
  };

  it("41 — message simple exécuté", async () => {
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["OK"],
      replanDates: [REF],
      explanation: ["test"],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const result = await processConversationTurn({
      text: "Je suis fatigué",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(result.assistantMessage.length).toBeGreaterThan(0);
    expect(executeActions).toHaveBeenCalled();
  });

  it("42 — suppression sport en attente confirmation", async () => {
    const executeActions = vi.fn();

    const result = await processConversationTurn({
      text: "Supprime mon sport",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(result.state.pending?.kind).toBe("confirmation");
    expect(executeActions).not.toHaveBeenCalled();
  });

  it("43 — confirmation exécute action pendante", async () => {
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["Sport supprimé"],
      replanDates: [REF],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const pending = await processConversationTurn({
      text: "Supprime mon sport",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    const confirmed = await processConversationTurn({
      text: "oui",
      state: pending.state,
      runtimeContext: runtime,
      executeActions,
    });

    expect(executeActions).toHaveBeenCalledTimes(1);
    expect(confirmed.state.pending).toBeUndefined();
  });

  it("44 — annulation ne modifie rien", async () => {
    const executeActions = vi.fn();

    const pending = await processConversationTurn({
      text: "Supprime mon sport",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    const cancelled = await processConversationTurn({
      text: "non",
      state: pending.state,
      runtimeContext: runtime,
      executeActions,
    });

    expect(cancelled.assistantMessage).toMatch(/rien modifi/i);
    expect(executeActions).not.toHaveBeenCalled();
  });

  it("45 — mémoire récurrente propose puis confirme", async () => {
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["Rythme mis à jour"],
      replanDates: [],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const proposal = await processConversationTurn({
      text: "Tous les mercredis je suis en repos",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(proposal.state.pending?.kind).toBe("memory_proposal");

    await processConversationTurn({
      text: "oui",
      state: proposal.state,
      runtimeContext: runtime,
      executeActions,
    });

    expect(executeActions).toHaveBeenCalled();
  });
});

describe("Sprint 3.1 — scénarios variés", () => {
  const samples = [
    ["Je travaille demain", "modify_work"],
    ["Pas de travail vendredi", "modify_work"],
    ["Je suis en vacances", "modify_vacation"],
    ["Congés la semaine prochaine", "modify_vacation"],
    ["Je suis en déplacement", "modify_travel"],
    ["Course 20 minutes", "modify_sport"],
    ["Entraînement demain", "modify_sport"],
    ["Réviser ce soir", "modify_study"],
    ["Lecture 15 min", "modify_study"],
    ["Enfants malades", "modify_children"],
    ["Routine enfants", "modify_children"],
    ["Je suis épuisée", "declare_fatigue"],
    ["Soir calme", "quiet_evening"],
  ] as const;

  samples.forEach(([text, intent], index) => {
    it(`${46 + index} — « ${text} » → ${intent}`, () => {
      expect(detectIntent(text).intent).toBe(intent);
    });
  });
});

describe("Sprint 3.1 — normalisation", () => {
  it("59 — accents normalisés", () => {
    expect(normalizeNlpText("  Déjà  ")).toBe("deja");
  });

  it("60 — wiring AuthenticatedAppLayout", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const layout = readFileSync(
      join(root, "app/layouts/AuthenticatedAppLayout.tsx"),
      "utf8",
    );
    const shell = readFileSync(
      join(root, "components/navigation/AppShell.tsx"),
      "utf8",
    );
    expect(shell).toContain("ConversationHeaderTrigger");
    expect(layout).toContain("ConversationProvider");
  });

  it("61 — barre visible sur /home sans flags onboarding", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: "/home",
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("62 — barre masquée sur onboarding", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: "/onboarding/household",
        progressLoading: false,
      }),
    ).toBe(false);
  });
});
