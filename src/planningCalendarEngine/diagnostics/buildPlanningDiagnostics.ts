/**
 * EPIC 5A — Diagnostic snapshot for dev page.
 */

import type { PlanningCalendarEngine } from "../engine/planningCalendarEngine";
import { defaultPlanningCalendarEngine } from "../engine/planningCalendarEngine";
import type { PlanningCalendarSnapshot } from "../types/calendarItem";
import { CALENDAR_CONNECTORS } from "../contract/calendarConnector";

export type PlanningDiagnostics = {
  readonly snapshot: PlanningCalendarSnapshot;
  readonly metrics: {
    eventCount: number;
    conflictCount: number;
    freeMinutes: number;
    busyMinutes: number;
    providerCount: number;
  };
  readonly connectors: ReadonlyArray<{
    id: string;
    label: string;
    status: "not_implemented";
  }>;
};

export async function buildPlanningDiagnostics(input: {
  userId: string;
  householdId?: string | null;
  date: string;
  engine?: PlanningCalendarEngine;
}): Promise<PlanningDiagnostics> {
  const engine = input.engine ?? defaultPlanningCalendarEngine;
  const snapshot = await engine.getToday({
    userId: input.userId,
    householdId: input.householdId,
    date: input.date,
  });
  const metrics = engine.deriveLoadMetrics(snapshot);

  return {
    snapshot,
    metrics: {
      ...metrics,
      providerCount: snapshot.sources.length,
    },
    connectors: CALENDAR_CONNECTORS.map((connector) => ({
      id: connector.id,
      label: connector.label,
      status: "not_implemented" as const,
    })),
  };
}
