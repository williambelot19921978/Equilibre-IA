/**
 * EPIC 5B — Synchronization Engine orchestrator.
 * All external sync logic — Planning Engine remains provider-agnostic.
 */

import type { PlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import { defaultPlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import { mergeCalendarItems } from "../../planningCalendarEngine/merge/mergeEngine";
import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type {
  PlanningCalendarCommand,
  PlanningCalendarResult,
} from "../../ai/actionEngine/planning/planningCalendarContract";
import { dispatchPlanRefresh } from "../../lib/planning/planRefreshEvents";
import type { GoogleCalendarConnector } from "../connectors/googleCalendarConnector";
import { createGoogleCalendarConnector } from "../connectors/googleCalendarConnector";
import { SyncEventBus, defaultSyncEventBus } from "../events/syncEventBus";
import type {
  ConflictResolution,
  SyncContext,
  SyncPullResult,
  SyncPushResult,
} from "../types/syncTypes";
import { detectSyncChanges } from "./changeDetector";
import { buildConflictResolutions, detectSyncConflicts } from "./conflictDetector";
import { OfflineSyncQueue, defaultOfflineSyncQueue } from "./offlineQueue";
import { recordSyncHistory } from "./syncHistory";

export type SynchronizationEngineDeps = {
  readonly planningEngine: PlanningCalendarEngine;
  readonly googleConnector: GoogleCalendarConnector;
  readonly offlineQueue: OfflineSyncQueue;
  readonly eventBus: SyncEventBus;
};

export class SynchronizationEngine {
  private readonly deps: SynchronizationEngineDeps;

  constructor(deps: SynchronizationEngineDeps) {
    this.deps = deps;
  }

  mergeItems(input: {
    readonly localItems: readonly CalendarItem[];
    readonly remoteItems: readonly CalendarItem[];
    readonly rangeStart: string;
    readonly rangeEnd: string;
    readonly timezone: string;
  }): readonly CalendarItem[] {
    return mergeCalendarItems({
      items: [...input.localItems, ...input.remoteItems],
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      timezone: input.timezone,
    }).items;
  }

  async pull(context: SyncContext, options?: { force?: boolean }): Promise<SyncPullResult> {
    this.deps.googleConnector.setContext({
      userId: context.userId,
      householdId: context.householdId,
    });

    this.deps.eventBus.emit({
      type: "SyncStarted",
      at: new Date().toISOString(),
      payload: { provider: "google", direction: "pull" },
    });

    const beforeSnapshot = await this.deps.planningEngine.buildSnapshot({
      userId: context.userId,
      householdId: context.householdId,
      start: context.rangeStart,
      end: context.rangeEnd,
    });

    const syncResult = await this.deps.googleConnector.pullSync(options?.force ?? false);
    if (!syncResult.success) {
      recordSyncHistory({
        direction: "pull",
        provider: "google",
        success: false,
        itemCount: 0,
        summary: syncResult.message,
      });
      this.deps.eventBus.emit({
        type: "SyncCompleted",
        at: new Date().toISOString(),
        payload: {
          provider: "google",
          direction: "pull",
          success: false,
          itemCount: 0,
          message: syncResult.message,
        },
      });
      return {
        success: false,
        pulledCount: 0,
        message: syncResult.message,
        items: [],
        changes: [],
      };
    }

    const afterSnapshot = await this.deps.planningEngine.buildSnapshot({
      userId: context.userId,
      householdId: context.householdId,
      start: context.rangeStart,
      end: context.rangeEnd,
    });

    const externalItems = afterSnapshot.timeline.items.filter((item) => item.origin === "google");
    const localItems = beforeSnapshot.timeline.items.filter((item) => item.origin !== "google");
    const changes = detectSyncChanges({
      before: beforeSnapshot.timeline.items,
      after: afterSnapshot.timeline.items,
    });
    const conflicts = detectSyncConflicts({
      localItems,
      externalItems,
      changes,
    });
    const resolutions = buildConflictResolutions(conflicts);

    if (resolutions.length > 0) {
      this.deps.eventBus.emit({
        type: "ConflictDetected",
        at: new Date().toISOString(),
        payload: { resolutions },
      });
    }

    dispatchPlanRefresh([context.rangeStart.slice(0, 10)]);

    const pulledCount = syncResult.synced ?? externalItems.length;
    const message = syncResult.message;

    recordSyncHistory({
      direction: "pull",
      provider: "google",
      success: true,
      itemCount: pulledCount,
      summary: message,
      conflictCount: resolutions.length,
    });

    this.deps.eventBus.emit({
      type: "SyncCompleted",
      at: new Date().toISOString(),
      payload: {
        provider: "google",
        direction: "pull",
        success: true,
        itemCount: pulledCount,
        message,
      },
    });

    return {
      success: true,
      pulledCount,
      message,
      items: afterSnapshot.timeline.items,
      changes,
    };
  }

  async push(context: SyncContext): Promise<SyncPushResult> {
    this.deps.googleConnector.setContext({
      userId: context.userId,
      householdId: context.householdId,
    });

    this.deps.eventBus.emit({
      type: "SyncStarted",
      at: new Date().toISOString(),
      payload: { provider: "google", direction: "push" },
    });

    const pending = this.deps.offlineQueue.listPending();
    const failures: string[] = [];
    let pushedCount = 0;

    for (const operation of pending) {
      this.deps.offlineQueue.markSyncing(operation.id);
      try {
        let result;
        if (operation.operation === "create" && operation.item) {
          result = await this.deps.googleConnector.createEvent(operation.item);
        } else if (operation.operation === "update" && operation.item) {
          result = await this.deps.googleConnector.updateEvent(operation.item);
        } else if (operation.operation === "delete" && operation.eventId) {
          result = await this.deps.googleConnector.deleteEvent(operation.eventId);
        } else {
          result = await this.deps.googleConnector.pushChanges(operation.item ? [operation.item] : []);
        }

        if (result.success) {
          this.deps.offlineQueue.markSynced(operation.id);
          pushedCount += 1;
        } else {
          this.deps.offlineQueue.markFailed(operation.id, result.message);
          failures.push(result.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Push échoué.";
        this.deps.offlineQueue.markFailed(operation.id, message);
        failures.push(message);
      }
    }

    const success = failures.length === 0;
    const message =
      pending.length === 0
        ? "Aucune opération en file."
        : `${pushedCount}/${pending.length} opération(s) poussée(s).`;

    recordSyncHistory({
      direction: "push",
      provider: "google",
      success,
      itemCount: pushedCount,
      summary: message,
    });

    this.deps.eventBus.emit({
      type: "SyncCompleted",
      at: new Date().toISOString(),
      payload: {
        provider: "google",
        direction: "push",
        success,
        itemCount: pushedCount,
        message,
      },
    });

    return {
      success,
      pushedCount,
      queuedCount: pending.length - pushedCount,
      message,
      failures,
    };
  }

  detectChanges(before: readonly CalendarItem[], after: readonly CalendarItem[]) {
    return detectSyncChanges({ before, after });
  }

  detectConflicts(input: {
    localItems: readonly CalendarItem[];
    externalItems: readonly CalendarItem[];
    changes: ReturnType<typeof detectSyncChanges>;
  }) {
    return detectSyncConflicts(input);
  }

  resolveConflicts(conflicts: ReturnType<typeof detectSyncConflicts>): ConflictResolution[] {
    return buildConflictResolutions(conflicts);
  }

  queuePush(item: CalendarItem, operation: "create" | "update" | "delete" = "update"): void {
    this.deps.offlineQueue.enqueue({
      id: `queue-${item.id}-${Date.now()}`,
      provider: "google",
      operation,
      item,
      eventId: String(item.metadata.externalEventId ?? item.metadata.googleEventId ?? item.id),
    });
  }

  async retryFailedPush(context: SyncContext): Promise<SyncPushResult> {
    return this.push(context);
  }

  /** Action Engine entry point — internal planning first, external push queued. */
  async executePlanningCommand(
    command: PlanningCalendarCommand,
  ): Promise<PlanningCalendarResult> {
    const result = await this.deps.planningEngine.executePlanningCommand(command);

    if (result.success && command.target.scope !== "internal") {
      this.queuePush({
        id: command.target.entryId ?? `planning-${Date.now()}`,
        type: "event",
        title: command.target.summary,
        start: command.target.date ?? new Date().toISOString(),
        end: command.target.date ?? new Date().toISOString(),
        timezone: "America/Montreal",
        allDay: false,
        owner: command.userId,
        participants: [],
        status: "confirmed",
        priority: 3,
        origin: "internal",
        syncState: "pending",
        source: "internal-planning",
        editable: true,
        metadata: command.payload,
      });
    }

    return result;
  }

  async reorganizeDay(input: {
    userId: string;
    date: string;
    calendarItemIds?: readonly string[];
  }) {
    return this.deps.planningEngine.reorganizeDay(input);
  }
}

export const defaultSynchronizationEngine = new SynchronizationEngine({
  planningEngine: defaultPlanningCalendarEngine,
  googleConnector: createGoogleCalendarConnector(),
  offlineQueue: defaultOfflineSyncQueue,
  eventBus: defaultSyncEventBus,
});
