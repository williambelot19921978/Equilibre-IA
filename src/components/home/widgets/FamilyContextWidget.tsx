import { Button } from "../../ui/Button";
import type { HomeWidgetContext } from "./types";

export function FamilyContextWidget({ context }: { context: HomeWidgetContext }) {
  return (
    <section className="home-widget home-widget-family">
      <div className="section-heading">
        <div>
          <p className="card-label">Contexte</p>
          <h2>Famille & vacances</h2>
        </div>
      </div>

      {context.contextHintsError && (
        <div className="message message-error">{context.contextHintsError}</div>
      )}

      {context.contextHints.length > 0 ? (
        <div className="context-hints-card">
          {context.contextHints.map((hint) => (
            <p key={hint}>{hint}</p>
          ))}
        </div>
      ) : (
        !context.contextHintsError && (
          <p className="planning-hint">Aucun contexte particulier pour cette date.</p>
        )
      )}

      {context.userId && (
        <Button variant="secondary" size="sm" onClick={context.onShowVacationForm}>
          Ajouter une période de vacances
        </Button>
      )}
    </section>
  );
}
