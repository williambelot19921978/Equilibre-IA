/**
 * EPIC 4C — Validation Engine.
 * Chaque action est validée avant prévisualisation et avant exécution.
 */

import type {
  SecureAction,
  SecureActionDraft,
  SecureActionType,
  ValidationIssue,
  ValidationResult,
} from "../types/secureAction";
import type { ActionEngineDependencies } from "../execution/actionEngineDependencies";

function issue(code: string, message: string, field?: string): ValidationIssue {
  return { code, message, field };
}

function result(valid: boolean, issues: ValidationIssue[] = []): ValidationResult {
  return { valid, issues };
}

export async function validateActionDraft(
  draft: SecureActionDraft,
  deps: ActionEngineDependencies,
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  if (!draft.payload || typeof draft.payload !== "object") {
    issues.push(issue("invalid_payload", "Payload d'action invalide.", "payload"));
  }

  if (!draft.summary?.trim()) {
    issues.push(issue("missing_summary", "Résumé d'action manquant.", "summary"));
  }

  const typeIssues = await validateByType(draft.type, draft, deps);
  issues.push(...typeIssues);

  return result(issues.length === 0, issues);
}

export function validateActionForExecution(
  action: SecureAction,
  userId: string,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (action.status !== "pending_confirmation" && action.status !== "executing") {
    issues.push(
      issue(
        "invalid_status",
        `Statut incompatible avec l'exécution : ${action.status}.`,
        "status",
      ),
    );
  }

  if (!action.executionAvailable) {
    issues.push(
      issue(
        "execution_unavailable",
        "Cette action n'est pas encore disponible à l'exécution.",
      ),
    );
  }

  if (!action.requiresConfirmation) {
    issues.push(issue("confirmation_required", "Confirmation utilisateur obligatoire."));
  }

  if (action.payload.userId && action.payload.userId !== userId) {
    issues.push(issue("permission_denied", "Action non autorisée pour cet utilisateur."));
  }

  if (!action.validation.valid) {
    issues.push(...action.validation.issues);
  }

  if (new Date(action.expiresAt).getTime() <= Date.now()) {
    issues.push(issue("expired", "Cette action a expiré — veuillez en demander une nouvelle."));
  }

  return result(issues.length === 0, issues);
}

async function validateByType(
  type: SecureActionType,
  draft: SecureActionDraft,
  deps: ActionEngineDependencies,
): Promise<ValidationIssue[]> {
  const payload = draft.payload;
  const userId = String(payload.userId ?? "");

  switch (type) {
    case "createTask":
    case "createReminder": {
      const title = String(payload.title ?? "").trim();
      if (!title) return [issue("missing_title", "Titre de tâche requis.", "title")];
      if (!userId) return [issue("missing_user", "Utilisateur requis.", "userId")];
      return [];
    }

    case "modifyTask":
    case "deleteTask":
    case "moveTask": {
      const taskId = String(payload.taskId ?? "");
      if (!taskId) return [issue("missing_task", "Tâche cible introuvable.", "taskId")];
      const tasks = await deps.getUserTasks(userId);
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return [issue("task_not_found", "La tâche n'existe plus ou est inaccessible.")];
      if (type === "moveTask" && !payload.targetDate) {
        return [issue("missing_date", "Date cible requise pour déplacer une tâche.", "targetDate")];
      }
      return [];
    }

    case "updateGoal": {
      if (!deps.isGoalsEnabled()) {
        return [issue("goals_disabled", "La fonctionnalité Objectifs est désactivée.")];
      }
      const goalId = String(payload.goalId ?? "");
      if (!goalId) return [issue("missing_goal", "Objectif cible requis.", "goalId")];
      const goals = deps.getUserGoals(userId);
      if (!goals.find((goal) => goal.id === goalId)) {
        return [issue("goal_not_found", "Objectif introuvable ou supprimé.")];
      }
      return [];
    }

    case "reorganizeDay": {
      if (!payload.date) return [issue("missing_date", "Date du planning requise.", "date")];
      return [];
    }

    case "rescheduleEvent": {
      const entryId = String(payload.entryId ?? "");
      if (!entryId) {
        return [issue("missing_entry", "Événement planning introuvable.", "entryId")];
      }
      return [];
    }

    case "notifyHousehold": {
      if (!deps.isHouseholdCollaborationEnabled()) {
        return [
          issue(
            "collaboration_disabled",
            "La collaboration foyer n'est pas activée — notification impossible.",
          ),
        ];
      }
      const message = String(payload.message ?? "").trim();
      if (!message) return [issue("missing_message", "Message de notification requis.", "message")];
      return [];
    }

    default:
      return [issue("unknown_type", `Type d'action inconnu : ${type}`)];
  }
}

/** Validation finale immédiatement avant écriture — données fraîches obligatoires. */
export async function validateActionBeforeExecution(
  action: SecureAction,
  userId: string,
  deps: ActionEngineDependencies,
): Promise<ValidationResult> {
  const base = validateActionForExecution(action, userId);
  if (!base.valid) return base;

  const draft: SecureActionDraft = {
    type: action.type,
    description: action.description,
    summary: action.summary,
    target: action.target,
    payload: action.payload,
    riskLevel: action.riskLevel,
    requiresConfirmation: action.requiresConfirmation,
    estimatedImpact: action.estimatedImpact,
    sourceIntent: action.sourceIntent,
    origin: action.origin,
    preview: action.preview,
    explainability: action.explainability,
    calendarScope: action.calendarScope,
    planningTarget: action.planningTarget,
    executionAvailable: action.executionAvailable,
  };

  const fresh = await validateActionDraft(draft, deps);
  if (!fresh.valid) return fresh;

  if (!userId.trim()) {
    return result(false, [
      issue("permission_denied", "Utilisateur non authentifié — action refusée."),
    ]);
  }

  return result(true, []);
}

export function formatValidationErrors(validation: ValidationResult): string {
  if (validation.valid) return "";
  return validation.issues.map((item) => item.message).join(" ");
}
