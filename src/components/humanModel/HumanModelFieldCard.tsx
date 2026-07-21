import type { InterpretedField } from "../../ai/humanModelFoundation";

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)} %`;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "Non estimé";
  if (typeof value === "object" && value !== null && "label" in value) {
    return String((value as { label: string }).label);
  }
  if (typeof value === "object" && value !== null && "name" in value) {
    const named = value as { name: string; progressPercent?: number };
    return named.progressPercent !== undefined
      ? `${named.name} (${named.progressPercent} %)`
      : named.name;
  }
  return String(value);
}

export function HumanModelFieldCard({
  title,
  field,
  testId,
  onWhy,
}: {
  title: string;
  field: InterpretedField<unknown>;
  testId?: string;
  onWhy: () => void;
}) {
  return (
    <article className="human-model-card" data-testid={testId}>
      <header className="human-model-card-header">
        <h3>{title}</h3>
        <span className="human-model-confidence">
          Confiance : {formatConfidence(field.confidence)}
        </span>
      </header>
      <p className="human-model-value">{formatValue(field.value)}</p>
      <p className="human-model-explanation">{field.explanation}</p>
      {field.reasons.length > 0 && (
        <ul className="human-model-reasons">
          {field.reasons.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <button type="button" className="human-model-why-btn" onClick={onWhy}>
        Pourquoi ?
      </button>
    </article>
  );
}
