import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { extractEntities } from "../../ai/nlp/entityExtractor";
import { resolveActions } from "../../ai/nlp/actionResolver";
import { detectClarificationNeeded } from "../../ai/nlp/nlpClarification";
import { detectIntent } from "../../ai/nlp/intentEngine";
import {
  APP_NAVIGATION_ITEMS,
  getDesktopSidebarItems,
  getDrawerSections,
} from "../navigation/appNavigationItems";
import { AppRoutes } from "../navigation/routes";
import { resolveWorkStatusForDate } from "../work/resolveWorkStatusForDate";
import { resolveCalendarDayStatus } from "../calendar/resolveCalendarDayStatus";
import { proposeHalfDayFreedActivity } from "../life/proposeHalfDayFreedActivity";
import { isSchoolDayForChildren } from "../family/isSchoolDayForChildren";
import { canModifyTimelineEntry } from "../planning/isTimelineEntryEditable";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

function makeEntry(overrides: Partial<DayTimelineEntry> = {}): DayTimelineEntry {
  return {
    id: "block-1",
    title: "Révision maths",
    visualType: "study",
    blockKind: "override",
    origin: "persisted",
    calendarItemId: "ci-1",
    startsAt: "2026-07-21T10:00:00",
    endsAt: "2026-07-21T10:45:00",
    locked: false,
    completed: false,
    ...overrides,
  };
}

describe("Sprint 4.8.1 — stats, édition, demi-journées", () => {
  it("A. Statistiques visible desktop sidebar", () => {
    const items = getDesktopSidebarItems();
    expect(items.some((item) => item.id === "statistics")).toBe(true);
    expect(items.find((item) => item.id === "statistics")?.route).toBe(
      AppRoutes.STATISTICS,
    );
  });

  it("B. Statistiques visible drawer mobile", () => {
    const sections = getDrawerSections();
    const organisation = sections.find((section) => section.title === "Organisation");
    expect(organisation?.items.some((item) => item.id === "statistics")).toBe(
      true,
    );
  });

  it("C. clic Statistiques ouvre /statistics", () => {
    const stats = APP_NAVIGATION_ITEMS.find((item) => item.id === "statistics");
    expect(stats?.route).toBe("/statistics");
  });

  it("D. route /statistics protégée dans AppRouter", () => {
    const router = readSrc("app/router/AppRouter.tsx");
    expect(router).toContain("AppRoutes.STATISTICS");
    expect(router).toContain("StatisticsPage");
  });

  it("E. bouton Modifier masqué si bloc non modifiable", () => {
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(menu).toContain("canModify");
    expect(canModifyTimelineEntry(makeEntry(), "live")).toBe(true);
    expect(
      canModifyTimelineEntry(makeEntry({ visualType: "wake" }), "live"),
    ).toBe(false);
  });

  it("F. log dev clic Modifier", () => {
    const timeline = readSrc("components/planning/DayTimeline.tsx");
    expect(timeline).toContain('[EDIT BLOCK CLICK]');
  });

  it("G. HomePage branche EditBlockModal", () => {
    const home = readSrc("pages/HomePage.tsx");
    expect(home).toContain("EditBlockModal");
    expect(home).toContain("editTimelineBlock");
    expect(home).toContain("onEditEntry");
  });

  it("H. « Je ne travaille pas demain matin » → demi-journée matin", () => {
    const text = "Je ne travaille pas demain matin";
    const entities = extractEntities({ text, referenceDate: "2026-07-20" });
    expect(entities.workExceptionKind).toBe("half_morning");
    expect(entities.dates[0]).toBe("2026-07-21");

    const clarification = detectClarificationNeeded({
      intent: "modify_work",
      confidence: 0.9,
      entities,
      rawText: text,
    });
    expect(clarification.needsClarification).toBe(true);

    const actions = resolveActions({
      parseResult: {
        intent: "modify_work",
        confidence: 0.9,
        entities,
        rawText: text,
      },
      referenceDate: "2026-07-20",
    }).actions;
    expect(actions.some((action) => action.type === "MarkRestDay")).toBe(false);
    expect(actions.length).toBe(0);
  });

  it("I. « Je ne travaille pas demain après-midi »", () => {
    const entities = extractEntities({
      text: "Je ne travaille pas demain après-midi",
      referenceDate: "2026-07-20",
    });
    expect(entities.workExceptionKind).toBe("half_afternoon");
  });

  it("J. demi-journée avec heure → MarkWorkDay pas MarkRestDay", () => {
    const entities = extractEntities({
      text: "Je ne travaille pas demain matin, je reprends à 14 h",
      referenceDate: "2026-07-20",
    });
    expect(entities.workExceptionKind).toBe("half_morning");
    const actions = resolveActions({
      parseResult: {
        intent: "modify_work",
        confidence: 0.9,
        entities,
        rawText: "Je ne travaille pas demain matin, je reprends à 14 h",
      },
      referenceDate: "2026-07-20",
    }).actions;
    expect(actions.some((action) => action.type === "MarkWorkDay")).toBe(true);
    expect(actions.some((action) => action.type === "MarkRestDay")).toBe(false);
    expect(actions[0]?.payload.halfDay).toBe("morning_off");
    expect(actions[0]?.payload.workStart).toBe("14:00");
  });

  it("K. « Je travaille seulement demain matin »", () => {
    const entities = extractEntities({
      text: "Je travaille seulement demain matin jusqu'à 12 h",
      referenceDate: "2026-07-20",
    });
    expect(entities.workExceptionKind).toBe("work_morning_only");
  });

  it("K2. « Je travaille demain matin »", () => {
    const entities = extractEntities({
      text: "Je travaille demain matin",
      referenceDate: "2026-07-20",
    });
    expect(entities.workExceptionKind).toBe("work_morning_only");
    expect(entities.dates[0]).toBe("2026-07-21");
  });

  it("L. pas de conversion repos journée entière", () => {
    const intent = detectIntent("Je ne travaille pas demain matin");
    expect(intent.intent).toBe("modify_work");
    const entities = extractEntities({
      text: "Je ne travaille pas demain matin",
      referenceDate: "2026-07-20",
    });
    expect(entities.workExceptionKind).toBe("half_morning");
    expect(entities.workExceptionKind).not.toBe("cancel");
  });

  it("M. calendrier demi-journée avec badge", () => {
    const status = resolveCalendarDayStatus({
      date: "2026-07-21",
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      contextPeriods: [
        {
          id: "1",
          household_id: "h",
          user_id: "u",
          context_type: "exceptional_work_hours",
          title: "Matin sans travail",
          starts_at: "2026-07-21T00:00:00.000Z",
          ends_at: "2026-07-21T23:59:59.999Z",
          affected_member_id: null,
          impact: {
            forceWorkDay: true,
            workStartOverride: "14:00",
            workExceptionType: "no_work_morning",
            affectedPeriod: "morning",
          },
          description: null,
          status: "active",
          created_by: "u",
          created_at: "",
          updated_at: "",
        },
      ],
    });
    expect(status.status).toBe("workday");
    expect(status.badge).toBe("Matin libre");
    expect(status.label).toBe("Demi-journée travaillée");
  });

  it("N. travail conservé après-midi via resolveWorkStatusForDate", () => {
    const work = resolveWorkStatusForDate({
      date: "2026-07-21",
      fixedWorkDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      contextPeriods: [
        {
          id: "1",
          household_id: "h",
          user_id: "u",
          context_type: "exceptional_work_hours",
          title: "Matin sans travail",
          starts_at: "2026-07-21T00:00:00.000Z",
          ends_at: "2026-07-21T23:59:59.999Z",
          affected_member_id: null,
          impact: {
            forceWorkDay: true,
            workStartOverride: "14:00",
            workEndOverride: "17:00",
            workExceptionType: "no_work_morning",
            affectedPeriod: "morning",
          },
          description: null,
          status: "active",
          created_by: "u",
          created_at: "",
          updated_at: "",
        },
      ],
      defaultStartTime: "09:00",
      defaultEndTime: "17:00",
    });
    expect(work.isWorkDay).toBe(true);
    expect(work.startTime).toBe("14:00");
    expect(work.endTime).toBe("17:00");
    expect(work.partialWorkDay?.type).toBe("no_work_morning");
  });

  it("O. matinée libre jour d'école → révision", () => {
    expect(
      isSchoolDayForChildren("2026-07-21", { childrenCount: 2 }),
    ).toBe(true);
    const proposal = proposeHalfDayFreedActivity({
      date: "2026-07-21",
      affectedPeriod: "morning",
      schoolContext: { childrenCount: 2 },
      studyPossible: true,
    });
    expect(proposal.mainProposal.type).toBe("revision");
  });

  it("P. demi-journée libre week-end → famille", () => {
    const proposal = proposeHalfDayFreedActivity({
      date: "2026-07-18",
      affectedPeriod: "afternoon",
      schoolContext: { childrenCount: 2, isWeekend: true },
    });
    expect(proposal.mainProposal.type).toBe("family");
  });

  it("Q. fatigue élevée → calme", () => {
    const proposal = proposeHalfDayFreedActivity({
      date: "2026-07-21",
      affectedPeriod: "morning",
      schoolContext: { childrenCount: 2 },
      fatigueHigh: true,
    });
    expect(proposal.mainProposal.type).toBe("calm");
  });

  it("R. une seule proposition principale", () => {
    const proposal = proposeHalfDayFreedActivity({
      date: "2026-07-21",
      affectedPeriod: "morning",
      schoolContext: { childrenCount: 2 },
    });
    expect(proposal.mainProposal).toBeDefined();
    expect(proposal.message).toContain("libre");
  });
});
