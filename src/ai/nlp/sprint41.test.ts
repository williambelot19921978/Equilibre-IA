import { describe, expect, it, vi } from "vitest";

import { resolveActions } from "./actionResolver";
import { extractEntities, normalizeNlpText } from "./entityExtractor";
import {
  createInitialConversationState,
  processConversationTurn,
} from "./conversationEngine";
import { detectClarificationNeeded } from "./nlpClarification";
import { detectIntent, parseUserMessage } from "./intentEngine";
import { normalizeNlpTextAdvanced } from "./textNormalizer";
import { INTENT_EXPRESSION_MATRIX } from "./intentMatrix";

const REF = "2026-07-15";

function parse(text: string, childNames: string[] = ["Peter"]) {
  return parseUserMessage({ text, referenceDate: REF, childNames });
}

/** 12 phrases obligatoires Sprint 4.1 */
const REQUIRED_PHRASES = [
  "Je suis en vacances du 10 au 18 août.",
  "Je travaille demain.",
  "Je travaille mercredi de 9 h à 17 h.",
  "Je finis une heure plus tard aujourd'hui.",
  "Je veux courir 45 minutes demain.",
  "Je veux lire 30 minutes ce soir.",
  "Je veux prier ce soir.",
  "Peter dort chez mamie vendredi.",
  "Tous les mercredis je suis en repos.",
  "Supprime mon sport de demain.",
  "J'ai un rendez-vous demain à 14 h.",
  "Déplace ma révision à demain matin.",
] as const;

describe("Sprint 4.1 — 12 phrases obligatoires", () => {
  it("01 — vacances du 10 au 18 août", () => {
    const r = parse("Je suis en vacances du 10 au 18 août.");
    expect(r.intent).toBe("modify_vacation");
    expect(r.entities.dateRange?.start).toBe("2026-08-10");
    expect(r.entities.dateRange?.end).toBe("2026-08-18");
  });

  it("02 — travaille demain", () => {
    const r = parse("Je travaille demain.");
    expect(r.intent).toBe("modify_work");
    expect(r.entities.dates).toContain("2026-07-16");
  });

  it("03 — travaille mercredi 9h-17h", () => {
    const r = parse("Je travaille mercredi de 9 h à 17 h.");
    expect(r.intent).toBe("modify_work");
    expect(r.entities.weekday).toBe("wednesday");
    expect(r.entities.workTimeStart).toBeTruthy();
    expect(r.entities.workTimeEnd).toBeTruthy();
  });

  it("04 — finis une heure plus tard aujourd'hui", () => {
    const r = parse("Je finis une heure plus tard aujourd'hui.");
    expect(r.intent).toBe("modify_work");
    expect(r.entities.durationDeltaMinutes).toBe(60);
    expect(r.entities.dates).toContain(REF);
  });

  it("05 — courir 45 minutes demain", () => {
    const r = parse("Je veux courir 45 minutes demain.");
    expect(r.intent).toBe("modify_sport");
    expect(r.entities.durationMinutes).toBe(45);
    expect(r.entities.dates).toContain("2026-07-16");
  });

  it("06 — lire 30 minutes ce soir", () => {
    const r = parse("Je veux lire 30 minutes ce soir.");
    expect(r.intent).toBe("modify_study");
    expect(r.entities.durationMinutes).toBe(30);
    expect(r.entities.dates).toContain(REF);
  });

  it("07 — prier ce soir", () => {
    const r = parse("Je veux prier ce soir.");
    expect(r.intent).toBe("modify_spiritual");
    expect(r.entities.dates).toContain(REF);
  });

  it("08 — Peter dort chez mamie vendredi", () => {
    const r = parse("Peter dort chez mamie vendredi.");
    expect(r.intent).toBe("modify_children");
    expect(r.entities.childName).toBe("Peter");
    expect(r.entities.location).toMatch(/mamie/);
    expect(r.entities.weekday).toBe("friday");
  });

  it("09 — tous les mercredis en repos", () => {
    const r = parse("Tous les mercredis je suis en repos.");
    expect(r.intent).toBe("modify_work");
    expect(r.entities.recurring).toBe(true);
    expect(r.entities.weekdays).toContain("wednesday");
  });

  it("10 — supprime sport de demain", () => {
    const r = parse("Supprime mon sport de demain.");
    expect(r.intent).toBe("modify_sport");
    expect(r.entities.dates).toContain("2026-07-16");
  });

  it("11 — rendez-vous demain 14h", () => {
    const r = parse("J'ai un rendez-vous demain à 14 h.");
    expect(r.intent).toBe("modify_calendar");
    expect(r.entities.dates).toContain("2026-07-16");
    expect(r.entities.times.length).toBeGreaterThan(0);
  });

  it("12 — déplace révision demain matin", () => {
    const r = parse("Déplace ma révision à demain matin.");
    expect(r.intent).toBe("modify_study");
    expect(r.entities.dates).toContain("2026-07-16");
  });
});

describe("Sprint 4.1 — actions résolues pour phrases clés", () => {
  it("13 — vacances → CreateVacationPeriod + RebuildDay", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je suis en vacances du 10 au 18 août."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateVacationPeriod")).toBe(true);
    expect(actions.some((a) => a.type === "RebuildDay")).toBe(true);
  });

  it("14 — travail demain → MarkWorkDay", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je travaille demain."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "MarkWorkDay")).toBe(true);
  });

  it("15 — travail avec horaires → MarkWorkDay avec heures", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je travaille mercredi de 9 h à 17 h."),
      referenceDate: REF,
    });
    const work = actions.find((a) => a.type === "MarkWorkDay");
    expect(work?.payload.workStart).toBeTruthy();
    expect(work?.payload.workEnd).toBeTruthy();
  });

  it("16 — plus tard aujourd'hui → UpdateWorkScheduleToday", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je finis une heure plus tard aujourd'hui."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "UpdateWorkScheduleToday")).toBe(true);
  });

  it("17 — sport → CreateWorkoutTask", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux courir 45 minutes demain."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateWorkoutTask")).toBe(true);
  });

  it("18 — lecture → CreateReadingBlock", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux lire 30 minutes ce soir."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateReadingBlock")).toBe(true);
  });

  it("19 — prière → CreatePrayerBlock", () => {
    const { actions } = resolveActions({
      parseResult: parse("Je veux prier ce soir."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreatePrayerBlock")).toBe(true);
  });

  it("20 — enfant → CreateChildContextPeriod", () => {
    const { actions } = resolveActions({
      parseResult: parse("Peter dort chez mamie vendredi."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateChildContextPeriod")).toBe(true);
  });

  it("21 — récurrent repos → memoryProposal", () => {
    const resolved = resolveActions({
      parseResult: parse("Tous les mercredis je suis en repos."),
      referenceDate: REF,
    });
    expect(resolved.memoryProposal).toBeDefined();
  });

  it("22 — supprimer sport → DeleteSportTasks avec date", () => {
    const { actions } = resolveActions({
      parseResult: parse("Supprime mon sport de demain."),
      referenceDate: REF,
    });
    const del = actions.find((a) => a.type === "DeleteSportTasks");
    expect(del).toBeDefined();
    expect(del?.payload.date).toBe("2026-07-16");
    expect(del?.requiresConfirmation).toBe(true);
  });

  it("23 — RDV → CreateAppointment", () => {
    const { actions } = resolveActions({
      parseResult: parse("J'ai un rendez-vous demain à 14 h."),
      referenceDate: REF,
    });
    expect(actions.some((a) => a.type === "CreateAppointment")).toBe(true);
  });

  it("24 — révision → CreateReadingBlock ou RebuildDay", () => {
    const { actions } = resolveActions({
      parseResult: parse("Déplace ma révision à demain matin."),
      referenceDate: REF,
    });
    expect(
      actions.some(
        (a) => a.type === "CreateReadingBlock" || a.type === "RebuildDay",
      ),
    ).toBe(true);
  });
});

describe("Sprint 4.1 — clarification plutôt qu'échec", () => {
  it("25 — travaille plus tard demande précision", () => {
    const r = parse("Je travaille plus tard.");
    const c = detectClarificationNeeded(r);
    expect(c.needsClarification).toBe(true);
    expect(c.message).toMatch(/quel jour/i);
  });

  it("26 — vacances sans dates demande précision", () => {
    const r = parse("Je suis en vacances.");
    const c = detectClarificationNeeded(r);
    expect(c.needsClarification).toBe(true);
    expect(c.message).toMatch(/dates/i);
  });

  it("27 — RDV sans heure demande précision", () => {
    const r = parse("J'ai un rendez-vous demain.");
    const c = detectClarificationNeeded(r);
    expect(c.needsClarification).toBe(true);
    expect(c.message).toMatch(/heure/i);
  });
});

describe("Sprint 4.1 — normalisation avancée", () => {
  const normalizationCases: Array<[string, RegExp | string]> = [
    ["Je BOSSE demain", "je travaille demain"],
    ["Je suis en vacances du 10 au 18 aout", /aout|august|10/],
    ["footing 30 min", /courir/],
    ["rdv demain 14h", /rendez-vous/],
    ["Je veux prier ce soir!!!", /prier/],
    ["Peter dort chez mamie vendredi prochain", /vendredi/],
    ["Je travaille de 9h a 17h demain", /9/],
    ["1h de sport", /1 heure/],
    ["demain matin reviser", /demain matin/],
    ["Deplace ma revision a demain matin", /reviser/],
  ];

  normalizationCases.forEach(([input, expected], index) => {
    it(`${28 + index} — normalise « ${input.slice(0, 40)} »`, () => {
      const out = normalizeNlpTextAdvanced(input);
      if (expected instanceof RegExp) {
        expect(out).toMatch(expected);
      } else {
        expect(out).toContain(expected);
      }
    });
  });
});

describe("Sprint 4.1 — variantes sans accents et fautes légères", () => {
  const variantCases: Array<[string, string]> = [
    ["je suis fatigue", "declare_fatigue"],
    ["je bosse demain", "modify_work"],
    ["pose mes vacances du 5 au 12 juillet", "modify_vacation"],
    ["je veux courir demain", "modify_sport"],
    ["temps de priere ce soir", "modify_spiritual"],
    ["seance de sport 20 min", "modify_sport"],
    ["musculation demain", "modify_sport"],
    ["marche 30 minutes", "modify_sport"],
    ["nous sommes en vacances", "modify_vacation"],
    ["je suis au travail mercredi", "modify_work"],
    ["annule mon sport", "modify_sport"],
    ["retire le sport de demain", "modify_sport"],
    ["moment spirituel ce soir", "modify_spiritual"],
    ["temps calme chretien", "modify_spiritual"],
    ["lecture 15 min ce soir", "modify_study"],
    ["reviser demain", "modify_study"],
    ["enfants malades", "modify_children"],
    ["routine enfants", "modify_children"],
    ["william est en deplacement", "modify_travel"],
    ["soiree tranquille", "quiet_evening"],
  ];

  variantCases.forEach(([text, intent], index) => {
    it(`${38 + index} — « ${text} » → ${intent}`, () => {
      expect(detectIntent(text).intent).toBe(intent);
    });
  });
});

describe("Sprint 4.1 — dates relatives et heures", () => {
  it("58 — après-demain", () => {
    const e = extractEntities({ text: "Sport après-demain", referenceDate: REF });
    expect(e.dates).toContain("2026-07-17");
  });

  it("59 — ce soir", () => {
    const e = extractEntities({ text: "Prier ce soir", referenceDate: REF });
    expect(e.dates).toContain(REF);
  });

  it("60 — demain matin", () => {
    const e = extractEntities({
      text: "Réviser demain matin",
      referenceDate: REF,
    });
    expect(e.dates).toContain("2026-07-16");
  });

  it("61 — semaine prochaine", () => {
    const e = extractEntities({
      text: "Vacances la semaine prochaine",
      referenceDate: REF,
    });
    expect(e.dateRange || e.dates.length).toBeTruthy();
  });

  it("62 — pendant 30 minutes", () => {
    const e = extractEntities({
      text: "Lire pendant 30 minutes",
      referenceDate: REF,
    });
    expect(e.durationMinutes).toBe(30);
  });

  it("63 — jusqu'à 18h", () => {
    const e = extractEntities({
      text: "Je travaille jusqu'à 18 h",
      referenceDate: REF,
    });
    expect(e.times.length + (e.workTimeEnd ? 1 : 0)).toBeGreaterThan(0);
  });

  it("64 — 14 h format", () => {
    const e = extractEntities({
      text: "RDV demain à 14 h",
      referenceDate: REF,
    });
    expect(e.times.length).toBeGreaterThan(0);
  });

  it("65 — une heure et demie", () => {
    const e = extractEntities({
      text: "Sport une heure et demie",
      referenceDate: REF,
    });
    expect(e.durationMinutes).toBe(90);
  });
});

describe("Sprint 4.1 — conversation fiable", () => {
  const runtime = {
    userId: "user-1",
    referenceDate: REF,
    childNames: ["Peter"],
    tasks: [],
  };

  it("66 — ne prétend pas succès si échec service", async () => {
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["Échec : impossible d'ajouter le rendez-vous"],
      replanDates: [],
      explanation: [],
      persistSucceeded: false,
      replanSucceeded: false,
      replanFailures: [],
      workBlocksVerified: false,
      persistError: "impossible d'ajouter le rendez-vous",
    });

    const result = await processConversationTurn({
      text: "J'ai un rendez-vous demain à 14 h.",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(result.assistantMessage).not.toMatch(/c'est fait/i);
    expect(result.assistantMessage.toLowerCase()).toMatch(/pas réussi|échec|impossible/i);
  });

  it("67 — confirme après succès réel", async () => {
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["Rendez-vous ajouté demain à 14h"],
      replanDates: ["2026-07-16"],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const result = await processConversationTurn({
      text: "J'ai un rendez-vous demain à 14 h.",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(result.assistantMessage.toLowerCase()).toMatch(/c'est fait|ajouté|rendez-vous/i);
  });

  it("68 — clarification sans exécution", async () => {
    const executeActions = vi.fn();

    const result = await processConversationTurn({
      text: "Je travaille plus tard.",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(executeActions).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/quel jour/i);
  });

  it("69 — debug info en dev", async () => {
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["OK"],
      replanDates: [REF],
      explanation: [],
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

    if (import.meta.env.DEV) {
      expect(result.debug?.detectedIntent).toBe("declare_fatigue");
      expect(result.debug?.normalizedText).toBeTruthy();
    } else {
      expect(result.debug).toBeUndefined();
    }
  });

  it("70 — suppression sport demande confirmation", async () => {
    const executeActions = vi.fn();

    const result = await processConversationTurn({
      text: "Supprime mon sport de demain.",
      state: createInitialConversationState(),
      runtimeContext: runtime,
      executeActions,
    });

    expect(result.state.pending?.kind).toBe("confirmation");
    expect(executeActions).not.toHaveBeenCalled();
  });
});

describe("Sprint 4.1 — matrice d'intentions documentée", () => {
  it("71 — matrice non vide", () => {
    expect(INTENT_EXPRESSION_MATRIX.length).toBeGreaterThan(5);
  });

  it("72 — chaque entrée a des exemples", () => {
    for (const entry of INTENT_EXPRESSION_MATRIX) {
      expect(entry.examples.length).toBeGreaterThan(0);
      expect(entry.intent).toBeTruthy();
    }
  });
});

describe("Sprint 4.1 — scénarios supplémentaires (80+ total)", () => {
  const extraSamples: Array<[string, string]> = [
    ["Pas de travail vendredi", "modify_work"],
    ["Congés cette semaine", "modify_vacation"],
    ["Je suis en déplacement", "modify_travel"],
    ["Course 20 minutes", "modify_sport"],
    ["Entraînement demain", "modify_sport"],
    ["Je suis épuisée", "declare_fatigue"],
    ["Soir calme", "quiet_evening"],
    ["Que me proposes-tu ?", "request_suggestion"],
    ["Quel type de journée aujourd'hui ?", "ask_question"],
    ["oui", "confirm"],
    ["non", "cancel"],
    ["Je travaille de 8h à 12h demain", "modify_work"],
    ["Vacances en août", "modify_vacation"],
    ["Peter reste chez papi samedi", "modify_children"],
    ["Je veux une pause ce midi", "modify_tasks"],
    ["Supprime mon sport", "modify_sport"],
    ["William voyage cette semaine", "modify_travel"],
    ["Je dors mal", "modify_sleep"],
    ["Réveil plus tôt demain", "modify_sleep"],
  ];

  extraSamples.forEach(([text, intent], index) => {
    it(`${73 + index} — « ${text} » → ${intent}`, () => {
      expect(parse(text).intent).toBe(intent);
    });
  });
});

describe("Sprint 4.1 — normalizeNlpText legacy", () => {
  it("92 — accents", () => {
    expect(normalizeNlpText("  Déjà  ")).toBe("deja");
  });

  it("93 — toutes les phrases obligatoires parsent sans unknown", () => {
    for (const phrase of REQUIRED_PHRASES) {
      const r = parse(phrase);
      expect(r.intent).not.toBe("unknown");
    }
  });
});
