/**
 * EPIC 6A — Observation Engine.
 */

import type {
  AdaptiveIntelligenceInput,
  BehaviorObservation,
  ObservationSource,
  ObservationType,
} from "../types/adaptiveTypes";
import { appendObservations } from "./observationStore";

function createObservation(input: {
  source: ObservationSource;
  type: ObservationType;
  label: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}): BehaviorObservation {
  return {
    id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source: input.source,
    type: input.type,
    confidence: input.confidence,
    label: input.label,
    metadata: input.metadata ?? {},
  };
}

function hourFromIso(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function observeFromInput(input: AdaptiveIntelligenceInput): BehaviorObservation[] {
  const observations: BehaviorObservation[] = [];

  for (const event of input.calendarEvents ?? []) {
    const category = event.category ?? "autre";
    const hour = hourFromIso(event.start);

    observations.push(
      createObservation({
        source: "calendar",
        type: "repeated",
        label: `${category} à ${hour} — « ${event.title} »`,
        confidence: 0.6,
        metadata: { eventId: event.id, category, hour, title: event.title },
      }),
    );

    if (/sport|muscu|fit|course/i.test(event.title)) {
      observations.push(
        createObservation({
          source: "semantic",
          type: "repeated",
          label: `Sport observé à ${hour}`,
          confidence: 0.75,
          metadata: { kind: "sport", hour, eventId: event.id },
        }),
      );
    }
  }

  for (const taskEvent of input.taskEvents ?? []) {
    const typeMap: Record<string, ObservationType> = {
      created: "created",
      deleted: "deleted",
      moved: "moved",
      cancelled: "cancelled",
      rescheduled: "rescheduled",
      completed: "completed",
    };
    const mapped = typeMap[taskEvent.eventType] ?? "repeated";

    observations.push(
      createObservation({
        source: "task",
        type: mapped,
        label: `${mapped} — « ${taskEvent.title} »`,
        confidence: 0.7,
        metadata: {
          taskEventId: taskEvent.id,
          eventType: taskEvent.eventType,
          occurredAt: taskEvent.occurredAt,
        },
      }),
    );

    if (mapped === "moved" || mapped === "rescheduled") {
      observations.push(
        createObservation({
          source: "planning",
          type: "rescheduled",
          label: `Report — « ${taskEvent.title} »`,
          confidence: 0.8,
          metadata: { taskEventId: taskEvent.id, title: taskEvent.title },
        }),
      );
    }
  }

  return observations;
}

export function recordObservations(
  userId: string,
  input: AdaptiveIntelligenceInput,
): BehaviorObservation[] {
  const fresh = observeFromInput(input);
  appendObservations(userId, fresh);
  return fresh;
}

export class ObservationEngine {
  observe(input: AdaptiveIntelligenceInput): BehaviorObservation[] {
    return observeFromInput(input);
  }

  record(userId: string, input: AdaptiveIntelligenceInput): BehaviorObservation[] {
    return recordObservations(userId, input);
  }
}

export const defaultObservationEngine = new ObservationEngine();
