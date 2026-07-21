import { Button } from "../ui/Button";
import type { ProposedAssistantAction } from "../../ai/conversationFoundation";

type AssistantActionCardProps = {
  action: ProposedAssistantAction;
  disabled?: boolean;
  onConfirm?: (actionId: string) => void | Promise<unknown>;
  onCancel?: (actionId: string) => void | Promise<unknown>;
};

export function AssistantActionCard({
  action,
  disabled = false,
  onConfirm,
  onCancel,
}: AssistantActionCardProps) {
  const actionId = action.actionId ?? action.type;
  const isPending = action.status === "pending_confirmation" && action.executable;
  const isUnavailable = action.executionAvailable === false;
  const preview = action.preview;

  return (
    <article
      className="assistant-action-card"
      data-testid={`assistant-action-card-${actionId}`}
    >
      <header className="assistant-action-card-header">
        <h4>{preview?.title ?? action.label}</h4>
        {action.riskLevel && (
          <span className={`assistant-action-risk assistant-action-risk-${action.riskLevel}`}>
            Risque {action.riskLevel}
          </span>
        )}
      </header>

      <p className="assistant-action-summary">{action.label}</p>
      {action.estimatedImpact && (
        <p className="assistant-action-impact">
          <strong>Impact :</strong> {action.estimatedImpact}
        </p>
      )}

      {action.calendarScope && (
        <p className="assistant-action-scope" data-testid={`assistant-action-scope-${actionId}`}>
          Portée : {action.calendarScope === "synchronized"
            ? "Aura + agenda"
            : action.calendarScope === "external"
              ? "Agenda externe"
              : "Planning interne"}
        </p>
      )}

      {isUnavailable && (
        <p className="assistant-action-not-available" role="status">
          Cette action n&apos;est pas encore disponible à l&apos;exécution.
        </p>
      )}

      {preview && (
        <div className="assistant-action-preview">
          <div>
            <p className="assistant-action-preview-label">Avant</p>
            <ul>
              {preview.before.map((item) => (
                <li key={`before-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="assistant-action-preview-label">Après</p>
            <ul>
              {preview.after.map((item) => (
                <li key={`after-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {action.explainability && (
        <details className="assistant-action-why">
          <summary>Pourquoi cette action ?</summary>
          <ul>
            {action.explainability.whyAction.map((reason) => (
              <li key={`why-${reason}`}>{reason}</li>
            ))}
            {action.explainability.whyTarget.map((reason) => (
              <li key={`target-${reason}`}>{reason}</li>
            ))}
            {action.explainability.whyTiming.map((reason) => (
              <li key={`timing-${reason}`}>{reason}</li>
            ))}
          </ul>
        </details>
      )}

      {action.validationValid === false && action.validationIssues && (
        <p className="assistant-action-validation-error" role="alert">
          {action.validationIssues.map((issue) => issue.message).join(" ")}
        </p>
      )}

      {action.status === "executed" && (
        <p className="assistant-action-status assistant-action-status-success">Action réalisée.</p>
      )}
      {action.status === "failed" && (
        <p className="assistant-action-status assistant-action-status-error">Erreur.</p>
      )}
      {action.status === "cancelled" && (
        <p className="assistant-action-status">Action abandonnée.</p>
      )}

      {isPending && (
        <div className="assistant-action-buttons">
          <Button
            type="button"
            size="sm"
            data-testid={`assistant-action-confirm-${actionId}`}
            disabled={disabled}
            onClick={() => onConfirm?.(actionId)}
          >
            Confirmer
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid={`assistant-action-cancel-${actionId}`}
            disabled={disabled}
            onClick={() => onCancel?.(actionId)}
          >
            Annuler
          </Button>
        </div>
      )}
    </article>
  );
}
