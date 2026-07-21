/**
 * EPIC 4C — Execution Engine.
 * Transforme une action validée + confirmée en appels services — aucune logique métier.
 */

import type { SecureAction, ActionExecutionReport } from "../types/secureAction";
import type { GoalImportance } from "../../../types/goal";
import { PLANNING_CALENDAR_NOT_IMPLEMENTED } from "../planning/planningCalendarContract";
import { validateActionBeforeExecution } from "../validation/validationEngine";
import type { ActionEngineDependencies } from "./actionEngineDependencies";

export class ActionExecutionEngine {
  private readonly deps: ActionEngineDependencies;

  constructor(deps: ActionEngineDependencies) {
    this.deps = deps;
  }

  async executeConfirmedAction(
    action: SecureAction,
    userId: string,
  ): Promise<ActionExecutionReport> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    const validation = await validateActionBeforeExecution(action, userId, this.deps);
    if (!validation.valid) {
      return {
        actionId: action.id,
        success: false,
        message: validation.issues.map((issue) => issue.message).join(" "),
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        error: "validation_failed",
      };
    }

    try {
      const resultPayload = await this.dispatch(action, userId);
      const finishedAt = new Date().toISOString();
      return {
        actionId: action.id,
        success: true,
        message: resultPayload.message ?? "Action réalisée.",
        startedAt,
        finishedAt,
        durationMs: Date.now() - startMs,
        resultPayload: resultPayload.data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur d'exécution.";
      return {
        actionId: action.id,
        success: false,
        message,
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        error: message,
      };
    }
  }

  private async dispatch(
    action: SecureAction,
    userId: string,
  ): Promise<{ message: string; data?: Readonly<Record<string, unknown>> }> {
    const payload = action.payload;

    switch (action.type) {
      case "createTask":
      case "createReminder": {
        const created = await this.deps.createTask({
          userId,
          title: String(payload.title),
          description: payload.description ? String(payload.description) : undefined,
          category: String(payload.category ?? "personal"),
          estimatedMinutes: Number(payload.estimatedMinutes ?? 30),
          dueAt: payload.dueAt ? String(payload.dueAt) : undefined,
          priority: Number(payload.priority ?? 3),
          splittable: Boolean(payload.splittable ?? false),
        });
        return {
          message: `Tâche « ${created.title} » créée.`,
          data: { taskId: created.id, title: created.title },
        };
      }

      case "modifyTask": {
        const taskId = String(payload.taskId);
        const status = payload.status as "todo" | "done" | "cancelled";
        await this.deps.updateTaskStatus({ taskId, status });
        return {
          message: `Tâche mise à jour (${status}).`,
          data: { taskId, status },
        };
      }

      case "deleteTask": {
        const taskId = String(payload.taskId);
        await this.deps.updateTaskStatus({ taskId, status: "cancelled" });
        return {
          message: "Tâche supprimée (annulée).",
          data: { taskId },
        };
      }

      case "moveTask": {
        if (this.deps.isPlanningCalendarEngineEnabled()) {
          const result = await this.deps.planningCalendarEngine.reorganizeDay({
            userId,
            date: String(payload.sourceDate ?? payload.date),
            calendarItemIds: payload.calendarItemId
              ? [String(payload.calendarItemId)]
              : undefined,
          });
          return {
            message: result.summary,
            data: { movedCount: result.movedCount },
          };
        }
        const result = await this.deps.rescheduleNonUrgentTasks({
          userId,
          date: String(payload.sourceDate ?? payload.date),
          calendarItemIds: payload.calendarItemId
            ? [String(payload.calendarItemId)]
            : undefined,
        });
        return {
          message: result.summary,
          data: { movedCount: result.moved.length },
        };
      }

      case "updateGoal": {
        const goalId = String(payload.goalId);
        const updated = this.deps.updateUserGoal(userId, goalId, {
          name: payload.name ? String(payload.name) : undefined,
          importance: payload.importance
            ? (String(payload.importance) as GoalImportance)
            : undefined,
        });
        if (!updated) throw new Error("Objectif introuvable.");
        return {
          message: `Objectif « ${updated.name} » mis à jour.`,
          data: { goalId: updated.id },
        };
      }

      case "reorganizeDay": {
        if (this.deps.isPlanningCalendarEngineEnabled()) {
          const result = await this.deps.reorganizePlanningDay({
            userId,
            date: String(payload.date),
          });
          return {
            message: result.summary,
            data: { movedCount: result.movedCount },
          };
        }
        const result = await this.deps.rescheduleNonUrgentTasks({
          userId,
          date: String(payload.date),
        });
        return {
          message: result.summary,
          data: { movedCount: result.moved.length },
        };
      }

      case "rescheduleEvent": {
        if (action.planningTarget) {
          const command = {
            userId,
            target: action.planningTarget,
            payload: action.payload,
          };
          const result = await this.deps.executePlanningCommand(command);
          if (!result.success) {
            throw new Error(result.message);
          }
          return {
            message: result.message,
            data: result.data,
          };
        }
        throw new Error(PLANNING_CALENDAR_NOT_IMPLEMENTED);
      }
      case "notifyHousehold":
        throw new Error(PLANNING_CALENDAR_NOT_IMPLEMENTED);

      default:
        throw new Error(`Type d'action non pris en charge : ${action.type}`);
    }
  }
}
