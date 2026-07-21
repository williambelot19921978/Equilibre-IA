import type { InterpretedField } from "../../ai/humanModelFoundation";
import { Button } from "../ui/Button";

type DetailModalProps = {
  title: string;
  field: InterpretedField<unknown>;
  open: boolean;
  onClose: () => void;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "Non estimé";
  if (typeof value === "object" && value !== null && "label" in value) {
    return String((value as { label: string }).label);
  }
  if (typeof value === "object" && value !== null && "name" in value) {
    const named = value as { name: string; progressPercent?: number };
    return named.progressPercent !== undefined
      ? `${named.name} — progression ~${named.progressPercent} %`
      : named.name;
  }
  return String(value);
}

export function HumanModelWhyModal({
  title,
  field,
  open,
  onClose,
}: DetailModalProps) {
  if (!open) return null;

  return (
    <div className="human-model-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="human-model-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="human-model-why-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="human-model-why-title">Pourquoi — {title}</h2>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </header>
        <p className="human-model-modal-value">{formatValue(field.value)}</p>
        <p>{field.explanation}</p>
        <p>
          <strong>Confiance :</strong> {Math.round(field.confidence * 100)} %
        </p>
        {field.reasons.length > 0 ? (
          <>
            <h3>Justifications</h3>
            <ul>
              {field.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>Aucune justification détaillée — données insuffisantes.</p>
        )}
      </div>
    </div>
  );
}
