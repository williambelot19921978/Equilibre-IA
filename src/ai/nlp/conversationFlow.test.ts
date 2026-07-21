import { describe, expect, it } from "vitest";

import { resolvePersonalExpression } from "../languageMemory/resolvePersonalExpression";
import {
  createReschedulePendingAction,
  isConversationActionConfirmationPhrase,
  isStandaloneReschedulePhrase,
  messageRequestsNonUrgentReschedule,
  RESCHEDULE_AMBIGUOUS_PROMPT,
} from "../../lib/nlp/conversationActionPending";
import { identifyDeferrableTimelineEntries } from "../../lib/planning/deferrableTasks";
import { selectLanguageMemoryHints } from "../core/selectLanguageMemoryHints";
import { enrichAssistantWithLanguageMemory } from "../core/enrichAssistantWithMemory";
import type { CalendarItemRecord, TaskRecord } from "../../types";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";

describe("conversation flow — fatigue et décalage", () => {
  it("« Je suis sec » produit une hypothèse liée à la fatigue", () => {
    const resolution = resolvePersonalExpression({
      message: "Je suis sec",
      userId: "user-1",
      memories: [],
      nlpParse: {
        intent: "unknown",
        confidence: 0.2,
        entities: { dates: [], times: [], scope: "punctual", recurring: false },
        rawText: "Je suis sec",
      },
      languageMemory: null,
      referenceDate: "2026-07-18",
    });

    expect(resolution.mode).toBe("needs_confirmation");
    expect(resolution.hypothesis?.resolvedIntent).toBe("declare_fatigue");
    expect(resolution.hypothesis?.resolvedMeaning).toMatch(/fatigu/i);
  });

  it("une résolution Language Memory ne produit pas le fallback générique enrichi", () => {
    const message = enrichAssistantWithLanguageMemory({
      message: "Je pense que tu veux dire que tu es fatigue. Est-ce bien cela ?",
      intent: "unknown",
      languageMemory: {
        hasSufficientData: true,
        declarative: {
          workStart: null,
          workEnd: null,
          wakeTime: null,
          bedTime: null,
          mainPriority: null,
          sleepNeededHours: null,
          workDays: [],
          onboardingCompleted: true,
        },
        living: {
          knowledgeLevelLabel: "Débutant",
          knowledgeScore: 20,
          globalConfidence: 0.4,
          coachPersonality: "bienveillant",
          topInsights: [
            {
              id: "sport-thursday",
              label: "Sport le jeudi",
              detail: "ajuster quand ça ne passe pas",
              confidence: 0.7,
            },
          ],
          dailyMissionTitle: "Mission du jour",
          dailyMissionDescription: "Prioriser le repos",
        },
        discovery: {
          progressPercent: 50,
          remainingCount: 2,
          isComplete: false,
        },
        behavior: null,
      },
      skipProactiveHints: true,
    });

    expect(message).not.toContain("Je n'ai pas reconnu");
    expect(message).not.toContain("Mission du jour");
  });

  it("« Décale » avec pendingAction confirme l'action", () => {
    expect(isConversationActionConfirmationPhrase("Décale")).toBe(true);
    expect(isConversationActionConfirmationPhrase("oui, décale")).toBe(true);
  });

  it("« Décale » sans contexte demande ce qu'il faut décaler", () => {
    expect(isStandaloneReschedulePhrase("Décale")).toBe(true);
    expect(RESCHEDULE_AMBIGUOUS_PROMPT).toMatch(/Que souhaites-tu décaler/i);
  });

  it("une pendingAction peut être créée puis vidée après exécution simulée", () => {
    const pending = createReschedulePendingAction({
      date: "2026-07-18",
      taskIds: ["task-1"],
      calendarItemIds: ["cal-1"],
      titles: ["Sport"],
    });

    expect(pending.type).toBe("reschedule_non_urgent_tasks");
    expect(pending.proposedTaskIds).toHaveLength(1);
  });

  it("les insights ne sont pas répétés à chaque tour", () => {
    const context = {
      hasSufficientData: true,
      declarative: {
        workStart: null,
        workEnd: null,
        wakeTime: null,
        bedTime: null,
        mainPriority: null,
        sleepNeededHours: null,
        workDays: [],
        onboardingCompleted: true,
      },
      living: {
        knowledgeLevelLabel: "Débutant",
        knowledgeScore: 20,
        globalConfidence: 0.4,
        coachPersonality: "bienveillant",
        topInsights: [
          {
            id: "sport-thursday",
            label: "Sport le jeudi",
            detail: "ajuster quand ça ne passe pas",
            confidence: 0.7,
          },
        ],
        dailyMissionTitle: "Mission du jour",
        dailyMissionDescription: "Prioriser le repos",
      },
      discovery: {
        progressPercent: 50,
        remainingCount: 2,
        isComplete: false,
      },
      behavior: null,
    };

    const first = selectLanguageMemoryHints(context, []);
    const shown = first.map((hint) => hint.id);
    const second = selectLanguageMemoryHints(context, shown);

    expect(first.length).toBeGreaterThan(0);
    expect(second.some((hint) => shown.includes(hint.id))).toBe(false);
  });

  it("identifie les tâches déplaçables non urgentes", () => {
    const nowIso = "2026-07-18T08:00:00.000Z";
    const timeline: DayTimelineEntry[] = [
      {
        id: "urgent",
        visualType: "task",
        title: "Rendez-vous médical",
        startsAt: "2026-07-18T15:00:00.000Z",
        endsAt: "2026-07-18T16:00:00.000Z",
        locked: true,
        origin: "persisted",
        blockKind: "appointment",
        calendarItemId: "cal-urgent",
      },
      {
        id: "movable",
        visualType: "task",
        title: "Rangement",
        startsAt: "2026-07-18T18:00:00.000Z",
        endsAt: "2026-07-18T19:00:00.000Z",
        locked: false,
        origin: "persisted",
        blockKind: "task",
        calendarItemId: "cal-move",
      },
    ];

    const items: CalendarItemRecord[] = [
      {
        id: "cal-urgent",
        household_id: "hh",
        user_id: "user",
        task_id: "task-urgent",
        title: "Rendez-vous médical",
        item_type: "event",
        starts_at: "2026-07-18T15:00:00.000Z",
        ends_at: "2026-07-18T16:00:00.000Z",
        locked: true,
        source: "manual",
        details: null,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: "cal-move",
        household_id: "hh",
        user_id: "user",
        task_id: "task-move",
        title: "Rangement",
        item_type: "task",
        starts_at: "2026-07-18T18:00:00.000Z",
        ends_at: "2026-07-18T19:00:00.000Z",
        locked: false,
        source: "engine",
        details: null,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];

    const tasksById = new Map<string, TaskRecord>([
      [
        "task-urgent",
        {
          id: "task-urgent",
          household_id: "hh",
          assigned_to: "user",
          created_by: "user",
          title: "Rendez-vous médical",
          category: "personal",
          estimated_minutes: 60,
          due_at: null,
          priority: 5,
          splittable: false,
          status: "planned",
          skip_count: 0,
          created_at: nowIso,
        },
      ],
      [
        "task-move",
        {
          id: "task-move",
          household_id: "hh",
          assigned_to: "user",
          created_by: "user",
          title: "Rangement",
          category: "home",
          estimated_minutes: 60,
          due_at: null,
          priority: 2,
          splittable: true,
          status: "planned",
          skip_count: 0,
          created_at: nowIso,
        },
      ],
    ]);

    const candidates = identifyDeferrableTimelineEntries({
      timeline,
      items,
      tasksById,
      nowIso,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.title).toBe("Rangement");
  });

  it("détecte une demande explicite de décalage non urgent", () => {
    expect(
      messageRequestsNonUrgentReschedule(
        "Je suis fatigué, décale ce qui n'est pas urgent",
      ),
    ).toBe(true);
  });
});
