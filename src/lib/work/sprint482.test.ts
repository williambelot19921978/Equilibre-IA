import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { extractEntities } from "../../ai/nlp/entityExtractor";
import { resolveActions } from "../../ai/nlp/actionResolver";
import { detectClarificationNeeded } from "../../ai/nlp/nlpClarification";
import { enrichWorkEntities } from "../nlp/enrichWorkEntities";
import { formatAssistantReply } from "../../ai/nlp/actionResolver";
import { verifyWorkBlocksInPlan } from "../work/verifyWorkBlocksInPlan";
import { isTimelineEntryCompletable } from "../planning/isTimelineEntryCompletable";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { DayPlan } from "../../types/planning";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

function makePlan(constraints: DayPlan["constraints"]): DayPlan {
  return {
    constraints,
    incompleteData: [],
    contextAdaptations: [],
    contextWarnings: [],
    unplannableTasks: [],
    freeMinutesRemaining: 60,
    fillPercentage: 40,
  };
}

describe("Sprint 4.8.2 — travail matin, terminer, calendrier compact", () => {
  it("A. « Je travaille demain matin » → work_morning_only", () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    expect(entities.workExceptionKind).toBe("work_morning_only");
  });

  it("B. clarification si horaires matin absents", () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    const clarification = detectClarificationNeeded({
      intent: "modify_work",
      confidence: 0.9,
      entities,
      rawText: "Je travaille demain matin",
    });
    expect(clarification.needsClarification).toBe(true);
  });

  it("C. enrichissement horaires profil", () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    const enriched = enrichWorkEntities(entities, {
      defaultWorkStart: "09:00",
      defaultWorkEnd: "12:00",
    });
    expect(enriched.workTimeStart).toBe("09:00");
    expect(enriched.workTimeEnd).toBe("12:00");
  });

  it("D. MarkWorkDay avec halfDay work_morning_only", () => {
    const entities = enrichWorkEntities(
      extractEntities({
        text: "Je travaille demain matin de 9 h à 12 h",
        referenceDate: "2026-07-20",
      }),
      { defaultWorkStart: "09:00", defaultWorkEnd: "17:00" },
    );
    const actions = resolveActions({
      parseResult: {
        intent: "modify_work",
        confidence: 0.9,
        entities,
        rawText: "Je travaille demain matin de 9 h à 12 h",
      },
      referenceDate: "2026-07-20",
    }).actions;
    const markWork = actions.find((action) => action.type === "MarkWorkDay");
    expect(markWork?.payload.halfDay).toBe("work_morning_only");
    expect(markWork?.payload.workStart).toBeTruthy();
    expect(markWork?.payload.workEnd).toBeTruthy();
  });

  it("E. réponse honnête échec persistance", () => {
    const message = formatAssistantReply({
      intent: "modify_work",
      actions: [{ type: "MarkWorkDay", payload: { halfDay: "work_morning_only" }, requiresConfirmation: false, explanation: "", reason: "" }],
      executionSummaries: ["Échec"],
      executionResult: {
        summaries: ["Échec"],
        replanDates: [],
        explanation: [],
        persistSucceeded: false,
        replanSucceeded: false,
        replanFailures: [],
        workBlocksVerified: false,
        persistError: "insert failed",
      },
    });
    expect(message).toContain("Je n'ai pas réussi");
  });

  it("F. réponse succès travail matin", () => {
    const message = formatAssistantReply({
      intent: "modify_work",
      actions: [{ type: "MarkWorkDay", payload: { halfDay: "work_morning_only" }, requiresConfirmation: false, explanation: "", reason: "" }],
      executionSummaries: ["OK"],
      executionResult: {
        summaries: ["OK"],
        replanDates: ["2026-07-21"],
        explanation: [],
        persistSucceeded: true,
        replanSucceeded: true,
        replanFailures: [],
        workBlocksVerified: true,
      },
    });
    expect(message).toContain("travail demain matin");
  });

  it("G. verifyWorkBlocksInPlan", () => {
    const verification = verifyWorkBlocksInPlan(
      makePlan([
        { id: "1", type: "commute_out", title: "A", startsAt: "", endsAt: "", locked: true, source: "engine" },
        { id: "2", type: "work", title: "T", startsAt: "", endsAt: "", locked: true, source: "engine" },
        { id: "3", type: "commute_in", title: "R", startsAt: "", endsAt: "", locked: true, source: "engine" },
      ]),
    );
    expect(verification.complete).toBe(true);
  });

  it("H. completeTimelineEntry service existe", () => {
    expect(readSrc("services/completeTimelineEntry.ts")).toContain(
      "completeActivityWithFeedback",
    );
  });

  it("I. activité persistée terminable sans modification", () => {
    const entry: DayTimelineEntry = {
      id: "e1",
      title: "Révision",
      visualType: "study",
      blockKind: "override",
      origin: "persisted",
      calendarItemId: "ci-1",
      startsAt: "2026-07-21T18:00:00",
      endsAt: "2026-07-21T18:45:00",
      locked: false,
      completed: false,
    };
    expect(isTimelineEntryCompletable(entry)).toBe(true);
  });

  it("J. EditBlockModal bouton Terminer indépendant", () => {
    const modal = readSrc("components/planning/EditBlockModal.tsx");
    expect(modal).toContain("onComplete");
    expect(modal).toContain("Terminer");
  });

  it("K. anti double-clic Terminer", () => {
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(menu).toContain("completing");
    expect(menu).toContain("Terminaison");
  });

  it("L. plan refresh event", () => {
    expect(readSrc("lib/planning/planRefreshEvents.ts")).toContain(
      "dispatchPlanRefresh",
    );
  });

  it("L2. planning sans calendrier mensuel (4.8.3)", () => {
    const page = readSrc("pages/PlanningPage.tsx");
    expect(page).not.toContain("MonthCalendar");
  });
});
