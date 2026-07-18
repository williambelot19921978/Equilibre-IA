import { describe, expect, it, vi } from "vitest";

import {
  archiveStaleExpression,
  classifyLanguageConfirmationResponse,
  computeConfidenceFromCounts,
  confirmPersonalExpression,
  createLanguageConfirmationRequest,
  decayExpressionConfidence,
  extractCorrectedMeaning,
  expressionsMatch,
  isLanguageConfirmationExpired,
  learnPersonalExpression,
  normalizeExpressionParts,
  normalizeUserExpression,
  rejectPersonalExpression,
  reactivateExpressionIfNeeded,
  resolvePersonalExpression,
  updateExpressionConfidence,
} from "./index";
import type { LanguageContextFingerprint, LanguageExpressionMemory } from "./types";
import {
  createInitialConversationState,
  processConversationTurn,
} from "../nlp/conversationEngine";
import { parseUserMessage } from "../nlp/intentEngine";

const REF_DATE = "2026-07-20";
const WILLIAM_ID = "user-william";
const MADELINE_ID = "user-madeline";

function baseFingerprint(
  overrides: Partial<LanguageContextFingerprint> = {},
): LanguageContextFingerprint {
  return {
    timeOfDay: "afternoon",
    recentSport: false,
    planningLoad: "moderate",
    nlpIntent: "unknown",
    lastUserTopic: null,
    sleepHoursRecent: 8,
    ...overrides,
  };
}

function memoryFixture(
  overrides: Partial<LanguageExpressionMemory> = {},
): LanguageExpressionMemory {
  return {
    id: "mem-1",
    userId: WILLIAM_ID,
    normalizedExpression: "je suis sec",
    originalExamples: ["Je suis sec"],
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "fatigue",
    confidence: 0.88,
    confirmationCount: 4,
    rejectionCount: 0,
    usageCount: 3,
    contexts: [baseFingerprint()],
    status: "confirmed",
    createdAt: "2026-07-01T10:00:00.000Z",
    lastUsedAt: "2026-07-19T10:00:00.000Z",
    lastConfirmedAt: "2026-07-18T10:00:00.000Z",
    updatedAt: "2026-07-19T10:00:00.000Z",
    ...overrides,
  };
}

function parse(text: string) {
  return parseUserMessage({
    text,
    referenceDate: REF_DATE,
    childNames: [],
  });
}

const COLLOQUIAL_PHRASES = [
  { phrase: "Je suis sec", core: "je suis sec" },
  { phrase: "Je suis rincé", core: "je suis rince" },
  { phrase: "Je suis KO", core: "je suis ko" },
  { phrase: "Je suis explosé", core: "je suis explose" },
  { phrase: "Je suis à plat", core: "je suis a plat" },
  { phrase: "Je suis mort", core: "je suis mort" },
] as const;

describe("Personal Language Learning — normalisation", () => {
  it("normalise ponctuation et casse", () => {
    expect(normalizeUserExpression("Je suis sec.")).toBe("je suis sec");
    expect(normalizeUserExpression("  Je   suis   sec  ")).toBe("je suis sec");
  });

  it("rapproche les variantes temporelles via le noyau", () => {
    const plain = normalizeExpressionParts("Je suis sec");
    const punctuated = normalizeExpressionParts("je suis sec.");
    const temporal = normalizeExpressionParts("Je suis sec aujourd'hui");

    expect(plain.core).toBe("je suis sec");
    expect(punctuated.core).toBe("je suis sec");
    expect(temporal.core).toBe("je suis sec");
    expect(expressionsMatch("je suis sec", temporal)).toBe(true);
  });
});

describe("Personal Language Learning — résolution", () => {
  it.each(COLLOQUIAL_PHRASES)(
    "propose une hypothèse bootstrap pour « $phrase » sans mémoire",
    ({ phrase }) => {
      const resolution = resolvePersonalExpression({
        message: phrase,
        userId: WILLIAM_ID,
        memories: [],
        nlpParse: parse(phrase),
        referenceDate: REF_DATE,
      });

      expect(resolution.hypothesis).not.toBeNull();
      expect(resolution.hypothesis?.resolvedIntent).toBe("declare_fatigue");
      expect(["needs_confirmation", "neutral_question"]).toContain(resolution.mode);
    },
  );

  it("utilise directement une mémoire confirmée à haute confiance", () => {
    const resolution = resolvePersonalExpression({
      message: "Je suis sec aujourd'hui",
      userId: WILLIAM_ID,
      memories: [memoryFixture()],
      nlpParse: parse("Je suis sec aujourd'hui"),
      referenceDate: REF_DATE,
    });

    expect(resolution.mode).toBe("direct");
    expect(resolution.matchedMemory?.userId).toBe(WILLIAM_ID);
    expect(resolution.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("n'applique pas la mémoire de William à Madeline", () => {
    const resolution = resolvePersonalExpression({
      message: "Je suis sec",
      userId: MADELINE_ID,
      memories: [memoryFixture({ userId: WILLIAM_ID })],
      nlpParse: parse("Je suis sec"),
      referenceDate: REF_DATE,
    });

    expect(resolution.matchedMemory).toBeNull();
    expect(resolution.hypothesis?.source).toBe("bootstrap_pattern");
  });

  it("ignore les mémoires rejetées ou archivées", () => {
    for (const status of ["rejected", "archived"] as const) {
      const resolution = resolvePersonalExpression({
        message: "Je suis sec",
        userId: WILLIAM_ID,
        memories: [memoryFixture({ status, confidence: 0.9 })],
        nlpParse: parse("Je suis sec"),
        referenceDate: REF_DATE,
      });

      expect(resolution.matchedMemory).toBeNull();
    }
  });

  it("retourne no_match pour un message vide de sens", () => {
    const resolution = resolvePersonalExpression({
      message: "   ",
      userId: WILLIAM_ID,
      memories: [],
      nlpParse: parse("bonjour"),
      referenceDate: REF_DATE,
    });

    expect(resolution.mode).toBe("no_match");
  });
});

describe("Personal Language Learning — confiance", () => {
  it("une seule confirmation ne produit jamais la confiance maximale", () => {
    const once = computeConfidenceFromCounts({
      confirmationCount: 1,
      rejectionCount: 0,
      usageCount: 0,
    });
    expect(once).toBeLessThan(0.85);
    expect(once).toBeGreaterThan(0.35);
  });

  it("augmente la confiance avec plusieurs confirmations", () => {
    const one = computeConfidenceFromCounts({
      confirmationCount: 1,
      rejectionCount: 0,
      usageCount: 0,
    });
    const three = computeConfidenceFromCounts({
      confirmationCount: 3,
      rejectionCount: 0,
      usageCount: 2,
    });
    expect(three).toBeGreaterThan(one);
  });

  it("baisse la confiance après rejet", () => {
    const base = computeConfidenceFromCounts({
      confirmationCount: 2,
      rejectionCount: 0,
      usageCount: 1,
    });
    const rejected = computeConfidenceFromCounts({
      confirmationCount: 2,
      rejectionCount: 1,
      usageCount: 1,
    });
    expect(rejected).toBeLessThan(base);
  });

  it("décroît progressivement avec le temps", () => {
    const fresh = updateExpressionConfidence({
      confirmationCount: 3,
      rejectionCount: 0,
      usageCount: 2,
      lastUsedAt: `${REF_DATE}T08:00:00.000Z`,
      referenceDate: REF_DATE,
    });
    const stale = updateExpressionConfidence({
      confirmationCount: 3,
      rejectionCount: 0,
      usageCount: 2,
      lastUsedAt: "2026-03-01T08:00:00.000Z",
      referenceDate: REF_DATE,
    });
    expect(stale).toBeLessThan(fresh);
    expect(decayExpressionConfidence(fresh, 90)).toBeLessThan(fresh);
  });

  it("archive une expression obsolète à faible confiance", () => {
    const archived = archiveStaleExpression(
      memoryFixture({
        confidence: 0.3,
        status: "learning",
        lastUsedAt: "2026-01-01T10:00:00.000Z",
      }),
      REF_DATE,
    );
    expect(archived?.status).toBe("archived");
  });

  it("réactive une expression archivée si nécessaire", () => {
    const reactivated = reactivateExpressionIfNeeded(
      memoryFixture({ status: "archived", confirmationCount: 2 }),
    );
    expect(reactivated.status).toBe("learning");
  });
});

describe("Personal Language Learning — apprentissage", () => {
  it("crée une candidate à la première occurrence", () => {
    const learned = learnPersonalExpression(
      {
        userId: WILLIAM_ID,
        originalText: "Je suis sec aujourd'hui",
        normalizedExpression: "je suis sec",
        resolvedIntent: "declare_fatigue",
        resolvedMeaning: "fatigue",
        context: baseFingerprint(),
        existing: null,
      },
      REF_DATE,
    );

    expect(learned.status).toBe("candidate");
    expect(learned.confirmationCount).toBe(0);
    expect(learned.originalExamples).toContain("Je suis sec aujourd'hui");
  });

  it("confirme et rejette sans doublons d'exemples", () => {
    const candidate = learnPersonalExpression(
      {
        userId: WILLIAM_ID,
        originalText: "Je suis sec",
        normalizedExpression: "je suis sec",
        resolvedIntent: "declare_fatigue",
        resolvedMeaning: "fatigue",
        context: baseFingerprint(),
        existing: null,
      },
      REF_DATE,
    );

    const confirmed = confirmPersonalExpression(candidate, REF_DATE);
    expect(confirmed.confirmationCount).toBe(1);
    expect(confirmed.status).toBe("learning");

    const reused = learnPersonalExpression(
      {
        userId: WILLIAM_ID,
        originalText: "Je suis sec",
        normalizedExpression: "je suis sec",
        resolvedIntent: "declare_fatigue",
        resolvedMeaning: "fatigue",
        context: baseFingerprint(),
        existing: confirmed,
      },
      REF_DATE,
    );
    expect(reused.originalExamples.filter((item) => item === "Je suis sec")).toHaveLength(1);

    const rejected = rejectPersonalExpression(confirmed, REF_DATE);
    expect(rejected.rejectionCount).toBe(1);
  });
});

describe("Personal Language Learning — confirmation conversationnelle", () => {
  it("classifie oui / non / correction", () => {
    expect(classifyLanguageConfirmationResponse("oui")).toBe("confirm");
    expect(classifyLanguageConfirmationResponse("exactement")).toBe("confirm");
    expect(classifyLanguageConfirmationResponse("non")).toBe("reject");
    expect(classifyLanguageConfirmationResponse("pas du tout")).toBe("reject");
    expect(
      classifyLanguageConfirmationResponse("je voulais dire que je suis sans argent"),
    ).toBe("correction");
    expect(extractCorrectedMeaning("je suis sans argent")).toBe("sans argent");
  });

  it("expire une hypothèse en attente", () => {
    const request = createLanguageConfirmationRequest({
      id: "hyp-1",
      normalizedExpression: "je suis sec",
      originalText: "Je suis sec",
      resolvedIntent: "declare_fatigue",
      resolvedMeaning: "fatigue",
      confidence: 0.55,
      source: "bootstrap_pattern",
      expressionMemoryId: null,
    });

    expect(isLanguageConfirmationExpired(request.expiresAt, request.expiresAt)).toBe(true);
    expect(
      isLanguageConfirmationExpired(
        request.expiresAt,
        new Date(Date.parse(request.expiresAt) - 60_000).toISOString(),
      ),
    ).toBe(false);
  });
});

describe("Personal Language Learning — intégration conversation", () => {
  function createPersistence() {
    const store = new Map<string, LanguageExpressionMemory>();

    return {
      store,
      persistence: {
        saveExpression: async (memory: LanguageExpressionMemory) => {
          const id = memory.id.startsWith("temp-") ? `saved-${memory.normalizedExpression}` : memory.id;
          const saved = { ...memory, id };
          store.set(saved.normalizedExpression, saved);
          return saved;
        },
        recordEvent: vi.fn().mockResolvedValue(undefined),
      },
    };
  }

  it("demande confirmation puis exécute declare_fatigue après oui", async () => {
    const { persistence, store } = createPersistence();
    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["Journée allégée"],
      replanDates: [REF_DATE],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const first = await processConversationTurn({
      text: "Je suis sec aujourd'hui",
      state: createInitialConversationState(),
      runtimeContext: {
        userId: WILLIAM_ID,
        referenceDate: REF_DATE,
        childNames: [],
        tasks: [],
        personalLanguageExpressions: [],
        personalLanguagePersistence: persistence,
      },
      executeActions,
    });

    expect(first.state.pending?.kind).toBe("language_confirmation");
    expect(first.assistantMessage).toMatch(/fatigu/i);
    expect(executeActions).not.toHaveBeenCalled();

    const second = await processConversationTurn({
      text: "oui",
      state: first.state,
      runtimeContext: {
        userId: WILLIAM_ID,
        referenceDate: REF_DATE,
        childNames: [],
        tasks: [],
        personalLanguageExpressions: [...store.values()],
        personalLanguagePersistence: persistence,
      },
      executeActions,
    });

    expect(second.state.pending).toBeUndefined();
    expect(executeActions).toHaveBeenCalledTimes(1);
    expect(store.get("je suis sec")?.confirmationCount).toBe(1);
  });

  it("rejette une hypothèse sur non", async () => {
    const { persistence, store } = createPersistence();
    const executeActions = vi.fn().mockResolvedValue({
      summaries: [],
      replanDates: [],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const first = await processConversationTurn({
      text: "Je suis sec",
      state: createInitialConversationState(),
      runtimeContext: {
        userId: WILLIAM_ID,
        referenceDate: REF_DATE,
        childNames: [],
        tasks: [],
        personalLanguageExpressions: [],
        personalLanguagePersistence: persistence,
      },
      executeActions,
    });

    const second = await processConversationTurn({
      text: "non",
      state: first.state,
      runtimeContext: {
        userId: WILLIAM_ID,
        referenceDate: REF_DATE,
        childNames: [],
        tasks: [],
        personalLanguageExpressions: [...store.values()],
        personalLanguagePersistence: persistence,
      },
      executeActions,
    });

    expect(second.assistantMessage).toMatch(/n'applique pas|D'accord/i);
    expect(store.get("je suis sec")?.rejectionCount).toBe(1);
  });

  it("utilise directement une mémoire confirmée sans redemander", async () => {
    const { persistence } = createPersistence();
    const confirmed = memoryFixture({
      id: "saved-je suis sec",
      confirmationCount: 5,
      confidence: 0.88,
      status: "confirmed",
    });

    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["Journée allégée"],
      replanDates: [REF_DATE],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const result = await processConversationTurn({
      text: "Je suis sec.",
      state: createInitialConversationState(),
      runtimeContext: {
        userId: WILLIAM_ID,
        referenceDate: REF_DATE,
        childNames: [],
        tasks: [],
        personalLanguageExpressions: [confirmed],
        personalLanguagePersistence: persistence,
      },
      executeActions,
    });

    expect(result.state.pending).toBeUndefined();
    expect(executeActions).toHaveBeenCalledTimes(1);
    expect(result.explanation.some((item) => item.includes("Mémoire personnelle"))).toBe(true);
  });
});
