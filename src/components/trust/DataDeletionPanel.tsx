import { useState } from "react";

import { Button } from "../ui/Button";
import {
  DELETION_SCOPE_LABELS,
  executeDeletion,
  requiresDeletionConfirmation,
  type DataDeletionScope,
} from "../../trustCenter";
import { trackInsightEvent } from "../../auraInsights/eventStore";

type DataDeletionPanelProps = {
  userId: string;
  onDeleted?: () => void;
};

const SCOPES: DataDeletionScope[] = ["habits", "checkins", "goals", "auraMemory", "all"];

export function DataDeletionPanel({ userId, onDeleted }: DataDeletionPanelProps) {
  const [scope, setScope] = useState<DataDeletionScope>("habits");
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function handleDelete() {
    const expected = requiresDeletionConfirmation(scope);
    if (confirmText !== expected) {
      setResult(`Tapez exactement « ${expected} » pour confirmer.`);
      return;
    }
    if (!window.confirm(`Supprimer définitivement : ${DELETION_SCOPE_LABELS[scope]} ?`)) return;

    const deletion = executeDeletion(userId, scope);
    trackInsightEvent(userId, "data_deleted", { scope });
    setResult(`Supprimé : ${deletion.details.join(", ")}`);
    setConfirmText("");
    onDeleted?.();
  }

  return (
    <section className="trust-deletion" data-testid="trust-deletion">
      <h2 className="aura-h2">Supprimer mes données</h2>
      <p className="aura-caption">Une confirmation est toujours demandée. Action irréversible.</p>

      <div className="trust-deletion-scopes">
        {SCOPES.map((item) => (
          <label key={item} className="trust-deletion-option">
            <input
              type="radio"
              name="deletion-scope"
              checked={scope === item}
              onChange={() => setScope(item)}
            />
            {DELETION_SCOPE_LABELS[item]}
          </label>
        ))}
      </div>

      <label className="trust-deletion-confirm">
        Confirmation : tapez {requiresDeletionConfirmation(scope)}
        <input
          type="text"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder={requiresDeletionConfirmation(scope)}
        />
      </label>

      <Button variant="secondary" size="sm" onClick={handleDelete} data-testid="trust-delete-submit">
        Supprimer
      </Button>

      {result && <p className="trust-deletion-result">{result}</p>}
    </section>
  );
}
