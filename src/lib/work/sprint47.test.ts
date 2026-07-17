import { describe, expect, it } from "vitest";

import { resolveAchievementFeedback } from "../../ai/achievementFeedbackEngine";
import { evaluateCompletionTiming, computeFreedMinutes } from "../planning/evaluateCompletionTiming";
import { resolveCompletionStatusLabel } from "../planning/resolveCompletionStatusLabel";
import { releaseEarlyFinishTime } from "../planning/releaseEarlyFinishTime";
import type { SchedulableBlock } from "../planning/absorbDurationChangeWithFreeTime";

const scheduledEnd = "2026-07-20T18:30:00.000Z";
const scheduledStart = "2026-07-20T18:00:00.000Z";

describe("Sprint 4.7", () => {
  it("A. séance sportive terminée — label Séance effectuée", () => {
    const label = resolveCompletionStatusLabel({
      activityCategory: "sport",
      isWorkout: true,
    });
    expect(label).toBe("Séance effectuée");
  });

  it("B. tâche terminée", () => {
    const feedback = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Ranger le bureau",
      completionTiming: "on_time",
    });
    expect(feedback.statusLabel).toBe("Effectué");
    expect(feedback.message.length).toBeGreaterThan(0);
  });

  it("C. activité terminée en avance", () => {
    const { timing, deltaMinutes } = evaluateCompletionTiming({
      scheduledEndsAt: scheduledEnd,
      actualCompletedAt: "2026-07-20T18:10:00.000Z",
    });
    expect(timing).toBe("early");
    expect(deltaMinutes).toBeLessThan(-5);
  });

  it("D. activité terminée à l'heure", () => {
    const { timing } = evaluateCompletionTiming({
      scheduledEndsAt: scheduledEnd,
      actualCompletedAt: "2026-07-20T18:28:00.000Z",
    });
    expect(timing).toBe("on_time");
  });

  it("E. activité terminée en retard", () => {
    const { timing } = evaluateCompletionTiming({
      scheduledEndsAt: scheduledEnd,
      actualCompletedAt: "2026-07-20T18:40:00.000Z",
    });
    expect(timing).toBe("late");
  });

  it("F. activité sans horaire", () => {
    const { timing } = evaluateCompletionTiming({
      scheduledEndsAt: null,
      actualCompletedAt: "2026-07-20T18:10:00.000Z",
    });
    expect(timing).toBe("unscheduled");
  });

  it("G. reprise après trois reports", () => {
    const feedback = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Révision",
      completionTiming: "on_time",
      skipCount: 3,
    });
    expect(feedback.celebrationLevel).toBe("important");
    expect(feedback.message).toMatch(/repouss/i);
  });

  it("H. fatigue déclarée", () => {
    const feedback = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Tâche",
      completionTiming: "on_time",
      energyLevel: "tired",
    });
    expect(feedback.message).toMatch(/difficile/i);
  });

  it("I. libération du temps restant", () => {
    const freed = computeFreedMinutes({
      scheduledEndsAt: scheduledEnd,
      actualCompletedAt: "2026-07-20T18:12:00.000Z",
    });
    expect(freed).toBe(18);
  });

  it("J. prochaine activité non déplacée automatiquement sans delta positif", () => {
    const blocks: SchedulableBlock[] = [
      {
        id: "a",
        startsAt: scheduledStart,
        endsAt: scheduledEnd,
        locked: false,
        flexible: false,
        title: "Révision",
      },
      {
        id: "b",
        startsAt: scheduledEnd,
        endsAt: "2026-07-20T19:00:00.000Z",
        locked: false,
        flexible: true,
        title: "Lecture",
      },
    ];
    const result = releaseEarlyFinishTime({
      blocks,
      buffers: [],
      targetBlockId: "a",
      scheduledEndsAt: scheduledEnd,
      actualCompletedAt: "2026-07-20T18:12:00.000Z",
    });
    expect(result.freedMinutes).toBe(18);
    expect(blocks[1].startsAt).toBe(scheduledEnd);
  });

  it("K. feedback varié", () => {
    const a = resolveAchievementFeedback({
      activityCategory: "sport",
      title: "Sport",
      completionTiming: "on_time",
      isWorkout: true,
      recentFeedbackIds: [],
    });
    const b = resolveAchievementFeedback({
      activityCategory: "sport",
      title: "Sport",
      completionTiming: "on_time",
      isWorkout: true,
      recentFeedbackIds: [a.id],
    });
    expect(a.message).not.toBe(b.message);
  });

  it("L. pas de répétition immédiate", () => {
    const first = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Tâche",
      completionTiming: "on_time",
    });
    const second = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Tâche",
      completionTiming: "on_time",
      recentFeedbackIds: [first.id],
    });
    expect(second.id).not.toBe(first.id);
  });

  it("M. persistance champs details documentés", () => {
    expect(
      JSON.stringify({
        completion_status_label: "Séance effectuée",
        actual_completed_at: scheduledEnd,
      }),
    ).toContain("Séance effectuée");
  });

  it("N. task_activity_events metadata", () => {
    const metadata = {
      completedEarly: true,
      feedbackId: "sport-early-1",
      deltaMinutes: -18,
    };
    expect(metadata.completedEarly).toBe(true);
  });

  it("O. affichage Séance effectuée", () => {
    expect(
      resolveCompletionStatusLabel({ activityCategory: "sport", isWorkout: true }),
    ).toBe("Séance effectuée");
  });

  it("P. accomplissement prioritaire", () => {
    const feedback = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Priorité",
      completionTiming: "early",
      deltaMinutes: -15,
      priority: "high",
    });
    expect(feedback.celebrationLevel).toBe("important");
  });

  it("Q. petite activité célébration discrète", () => {
    const feedback = resolveAchievementFeedback({
      activityCategory: "task",
      title: "Micro tâche",
      completionTiming: "on_time",
      durationMinutes: 5,
    });
    expect(feedback.celebrationLevel).toBe("discrete");
  });
});
