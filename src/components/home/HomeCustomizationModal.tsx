import { useEffect, useState } from "react";

import {
  DEFAULT_HOME_PREFERENCES,
  HOME_WIDGET_LABELS,
  type HomePreferences,
  type HomeWidgetId,
} from "../../types/homePreferences";
import { Button } from "../ui/Button";

type HomeCustomizationModalProps = {
  open: boolean;
  preferences: HomePreferences;
  saving: boolean;
  onClose: () => void;
  onSave: (preferences: HomePreferences) => Promise<void>;
};

function moveWidget(order: HomeWidgetId[], id: HomeWidgetId, direction: -1 | 1) {
  const index = order.indexOf(id);
  if (index < 0) return order;
  const target = index + direction;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function HomeCustomizationModal({
  open,
  preferences,
  saving,
  onClose,
  onSave,
}: HomeCustomizationModalProps) {
  const [draft, setDraft] = useState(preferences);

  useEffect(() => {
    if (open) setDraft(preferences);
  }, [open, preferences]);

  if (!open) return null;

  function toggleWidget(id: HomeWidgetId) {
    setDraft((current) => {
      const visible = new Set(current.visibleWidgets);
      if (visible.has(id)) visible.delete(id);
      else visible.add(id);
      return { ...current, visibleWidgets: [...visible] };
    });
  }

  return (
    <div className="modal-overlay home-customization-overlay">
      <div className="modal-card home-customization-modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <h2>Personnaliser mon accueil</h2>
            <p>Choisis les blocs visibles et leur ordre.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <ul className="home-customization-list">
          {draft.widgetOrder.map((id) => (
            <li key={id} className="home-customization-item">
              <label>
                <input
                  type="checkbox"
                  checked={draft.visibleWidgets.includes(id)}
                  onChange={() => toggleWidget(id)}
                />
                {HOME_WIDGET_LABELS[id]}
              </label>
              <div className="home-customization-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Monter ${HOME_WIDGET_LABELS[id]}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      widgetOrder: moveWidget(current.widgetOrder, id, -1),
                    }))
                  }
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Descendre ${HOME_WIDGET_LABELS[id]}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      widgetOrder: moveWidget(current.widgetOrder, id, 1),
                    }))
                  }
                >
                  ↓
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <footer className="modal-footer home-customization-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft(DEFAULT_HOME_PREFERENCES)}
          >
            Restaurer la disposition par défaut
          </Button>
          <Button
            type="button"
            loading={saving}
            onClick={() => void onSave(draft)}
          >
            Enregistrer
          </Button>
        </footer>
      </div>
    </div>
  );
}
