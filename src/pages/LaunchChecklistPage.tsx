import { useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  getChecklistProgress,
  getLaunchChecklist,
  resetLaunchChecklist,
  updateLaunchChecklistItem,
  type ChecklistPriority,
  type ChecklistStatus,
  type LaunchChecklistItem,
} from "../release";
import { Link } from "react-router-dom";
import { AppRoutes } from "../lib/navigation/routes";

const STATUS_LABELS: Record<ChecklistStatus, string> = {
  pending: "À faire",
  in_progress: "En cours",
  done: "Validé",
  blocked: "Bloqué",
};

const PRIORITY_LABELS: Record<ChecklistPriority, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export function LaunchChecklistPage() {
  const [items, setItems] = useState<LaunchChecklistItem[]>(() => getLaunchChecklist());
  const progress = getChecklistProgress(items);

  function patchItem(
    id: string,
    patch: Partial<Pick<LaunchChecklistItem, "status" | "owner" | "dueDate" | "comment">>,
  ) {
    setItems(updateLaunchChecklistItem(id, patch));
  }

  function handleReset() {
    setItems(resetLaunchChecklist());
  }

  return (
    <PageContainer>
      <SectionHeader
        label="Lancement bêta"
        title="Checklist de lancement"
        subtitle={`${progress.done}/${progress.total} validés (${progress.percent} %)`}
      />

      <div className="launch-checklist-progress aura-glass" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="launch-checklist-progress-bar" style={{ width: `${progress.percent}%` }} />
      </div>

      <div className="launch-checklist-actions">
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Réinitialiser
        </Button>
      </div>

      <div className="launch-checklist-grid" data-testid="launch-checklist-page">
        {items.map((item) => (
          <Card key={item.id} className={`launch-checklist-item launch-priority-${item.priority}`}>
            <header className="launch-checklist-item-header">
              <h2>{item.label}</h2>
              <span className={`launch-status launch-status-${item.status}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </header>

            <div className="launch-checklist-fields">
              <label>
                Priorité
                <span className="launch-priority-pill">{PRIORITY_LABELS[item.priority]}</span>
              </label>

              <label htmlFor={`${item.id}-status`}>
                État
                <select
                  id={`${item.id}-status`}
                  value={item.status}
                  onChange={(event) =>
                    patchItem(item.id, { status: event.target.value as ChecklistStatus })
                  }
                >
                  {(Object.keys(STATUS_LABELS) as ChecklistStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor={`${item.id}-owner`}>
                Responsable
                <input
                  id={`${item.id}-owner`}
                  type="text"
                  value={item.owner}
                  onChange={(event) => patchItem(item.id, { owner: event.target.value })}
                />
              </label>

              <label htmlFor={`${item.id}-date`}>
                Date
                <input
                  id={`${item.id}-date`}
                  type="date"
                  value={item.dueDate ?? ""}
                  onChange={(event) =>
                    patchItem(item.id, { dueDate: event.target.value || null })
                  }
                />
              </label>

              <label htmlFor={`${item.id}-comment`} className="launch-checklist-comment">
                Commentaire
                <textarea
                  id={`${item.id}-comment`}
                  rows={2}
                  value={item.comment}
                  onChange={(event) => patchItem(item.id, { comment: event.target.value })}
                  placeholder="Notes, liens, blockers…"
                />
              </label>
            </div>
          </Card>
        ))}
      </div>

      <p className="aura-caption">
        <Link to={AppRoutes.SETTINGS}>Retour aux paramètres</Link>
      </p>
    </PageContainer>
  );
}
