import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { extractEntities } from "../../ai/nlp/entityExtractor";
import { processConversationTurn } from "../../ai/nlp/conversationEngine";
import { parseClarificationTimeResponse } from "../nlp/parseClarificationTimeResponse";
import {
  computeMissingWorkEntities,
  createPendingConversationAction,
  isPendingActionExpired,
  isPendingCancellationPhrase,
  mergePendingEntities,
} from "../nlp/pendingConversationAction";
import { detectClarificationNeeded } from "../../ai/nlp/nlpClarification";
import { isTimelineEntryCancellable } from "../planning/isTimelineEntryCancellable";
import { isCancelledCalendarItem } from "../planning/isCancelledCalendarItem";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { addMinutesToIso } from "../time/daySchedule";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

describe("Sprint 4.8.3 — planning sans calendrier, annuler, clarification pending", () => {
  it("A. aucun MonthCalendar sur /planning", () => {
    const page = readSrc("pages/PlanningPage.tsx");
    expect(page).not.toContain("MonthCalendar");
    expect(page).not.toContain("showMobileCalendar");
    expect(page).not.toContain("Choisir une date");
  });

  it("B. navigation jour conservée", () => {
    const page = readSrc("pages/PlanningPage.tsx");
    expect(page).toContain("DayNavigationBar");
  });

  it("C. lien vers /calendar", () => {
    const page = readSrc("pages/PlanningPage.tsx");
    expect(page).toContain("Ouvrir le calendrier");
    expect(page).toContain("AppRoutes.CALENDAR");
  });

  it("D. cancelTimelineEntry central", () => {
    expect(readSrc("services/cancelTimelineEntry.ts")).toContain(
      "cancelTimelineEntry",
    );
    expect(readSrc("services/blockActionService.ts")).toContain(
      'action === "cancel"',
    );
  });

  it("E. bouton Annuler avec anti double-clic", () => {
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(menu).toContain("Annulation");
    expect(menu).toContain("cancelling");
  });

  it("F. activité annulable détectée", () => {
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
    expect(isTimelineEntryCancellable(entry)).toBe(true);
  });

  it("G. calendar_item cancelled filtré", () => {
    expect(
      isCancelledCalendarItem({
        id: "1",
        household_id: "h",
        user_id: "u",
        task_id: null,
        title: "T",
        item_type: "activity",
        starts_at: "",
        ends_at: "",
        locked: false,
        source: "user",
        details: { status: "cancelled_for_today" },
        created_at: "",
        updated_at: "",
      }),
    ).toBe(true);
  });

  it("H. feedback annulation dans cancelTimelineEntry", () => {
    expect(readSrc("services/cancelTimelineEntry.ts")).toContain(
      "Activité annulée pour aujourd'hui.",
    );
  });

  it("I. « Je travaille demain matin » crée clarification pending", async () => {
    const executeActions = vi.fn();
    const result = await processConversationTurn({
      text: "Je travaille demain matin",
      state: { messages: [] },
      runtimeContext: {
        userId: "u1",
        referenceDate: "2026-07-20",
        childNames: [],
        tasks: [],
      },
      executeActions,
    });

    expect(result.state.pending?.kind).toBe("clarification");
    expect(executeActions).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/commences-tu/i);
  });

  it("J. « De 8 h à midi » complète l'action pending", async () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    const pending = createPendingConversationAction({
      intent: "modify_work",
      originalText: "Je travaille demain matin",
      missingEntities: computeMissingWorkEntities(entities),
      collectedEntities: entities,
      targetDate: "2026-07-21",
    });

    const parsed = parseClarificationTimeResponse("De 8 h à midi");
    expect(parsed.startTime).toBe("08:00");
    expect(parsed.endTime).toBe("12:00");

    const executeActions = vi.fn().mockResolvedValue({
      summaries: ["OK"],
      replanDates: ["2026-07-21"],
      explanation: [],
      persistSucceeded: true,
      replanSucceeded: true,
      replanFailures: [],
      workBlocksVerified: true,
    });

    const result = await processConversationTurn({
      text: "De 8 h à midi",
      state: {
        messages: [],
        pending: {
          kind: "clarification",
          action: pending,
          message: "À quelle heure commences-tu et termines-tu demain matin ?",
        },
      },
      runtimeContext: {
        userId: "u1",
        referenceDate: "2026-07-20",
        childNames: [],
        tasks: [],
      },
      executeActions,
    });

    expect(executeActions).toHaveBeenCalled();
    expect(result.state.pending).toBeUndefined();
  });

  it("K. « 8h-12h » reconnu", () => {
    const parsed = parseClarificationTimeResponse("8h-12h");
    expect(parsed.startTime).toBe("08:00");
    expect(parsed.endTime).toBe("12:00");
  });

  it("L. « de huit heures à midi » reconnu", () => {
    const parsed = parseClarificationTimeResponse("de huit heures à midi");
    expect(parsed.startTime).toBe("08:00");
    expect(parsed.endTime).toBe("12:00");
  });

  it("M. conservation date demain dans pending", () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    const merged = mergePendingEntities(entities, {
      workTimeStart: "08:00",
      workTimeEnd: "12:00",
    });
    expect(merged.dates[0]).toBe("2026-07-21");
  });

  it("N. réponse partielle startTime", async () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    const pending = createPendingConversationAction({
      intent: "modify_work",
      originalText: "Je travaille demain matin",
      missingEntities: ["startTime", "endTime"],
      collectedEntities: entities,
      targetDate: "2026-07-21",
    });

    const executeActions = vi.fn();
    const result = await processConversationTurn({
      text: "8 h",
      state: {
        messages: [],
        pending: {
          kind: "clarification",
          action: pending,
          message: "À quelle heure commences-tu et termines-tu demain matin ?",
        },
      },
      runtimeContext: {
        userId: "u1",
        referenceDate: "2026-07-20",
        childNames: [],
        tasks: [],
      },
      executeActions,
    });

    expect(result.state.pending?.kind).toBe("clarification");
    expect(executeActions).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/termines-tu/i);
  });

  it("O. annulation du pending", async () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    const pending = createPendingConversationAction({
      intent: "modify_work",
      originalText: "Je travaille demain matin",
      missingEntities: ["startTime", "endTime"],
      collectedEntities: entities,
      targetDate: "2026-07-21",
    });

    const result = await processConversationTurn({
      text: "Finalement non",
      state: {
        messages: [],
        pending: {
          kind: "clarification",
          action: pending,
          message: "Clarification",
        },
      },
      runtimeContext: {
        userId: "u1",
        referenceDate: "2026-07-20",
        childNames: [],
        tasks: [],
      },
      executeActions: vi.fn(),
    });

    expect(result.state.pending).toBeUndefined();
    expect(result.assistantMessage).toMatch(/n'applique pas/i);
  });

  it("P. expiration du pending", () => {
    const action = createPendingConversationAction({
      intent: "modify_work",
      originalText: "test",
      missingEntities: ["startTime"],
      collectedEntities: {},
    });
    expect(
      isPendingActionExpired(action, addMinutesToIso(action.createdAt, 31)),
    ).toBe(true);
  });

  it("Q. phrase annulation pending reconnue", () => {
    expect(isPendingCancellationPhrase("laisse tomber")).toBe(true);
    expect(isPendingCancellationPhrase("finalement non")).toBe(true);
  });

  it("R. clarification initiale sans horaires profil", () => {
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
});
