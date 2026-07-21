/**
 * EPIC 6E — Life Timeline — major life changes.
 */

import type { LifeKnowledgeInput, LifeTimelineEvent } from "../types/lifeKnowledgeTypes";
import { getTimelineEvents, addTimelineEvent } from "../store/knowledgeStore";

export function buildTimelineFromInput(input: LifeKnowledgeInput): LifeTimelineEvent[] {
  const stored = getTimelineEvents(input.userId);
  const derived: LifeTimelineEvent[] = [];

  for (const goal of input.activeGoals ?? []) {
    derived.push({
      id: `timeline-goal-${goal.id}`,
      kind: "new_goal",
      title: "Nouvel objectif",
      description: goal.name,
      date: input.date,
      source: "goals",
      createdAt: input.now ?? new Date().toISOString(),
    });
  }

  const merged = [...stored];
  for (const event of derived) {
    if (!merged.some((item) => item.id === event.id)) {
      addTimelineEvent(input.userId, event);
      merged.push(event);
    }
  }

  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

export function recordLifeChange(
  userId: string,
  event: Omit<LifeTimelineEvent, "createdAt">,
): LifeTimelineEvent {
  const full: LifeTimelineEvent = {
    ...event,
    createdAt: new Date().toISOString(),
  };
  addTimelineEvent(userId, full);
  return full;
}
