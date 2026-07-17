import { Button } from "../../ui/Button";
import type { HomeWidgetContext } from "./types";

export function NextActivityWidget({ context }: { context: HomeWidgetContext }) {
  return (
    <section className="home-widget home-widget-next">
      <div className="section-heading">
        <div>
          <p className="card-label">Maintenant</p>
          <h2>Prochaine activité</h2>
        </div>
      </div>

      <div className="planning-summary-card planning-summary-card-compact">
        <div className="planning-summary-row">
          <span>Prochaine activité</span>
          <strong>
            {context.nextActivity
              ? `${context.nextActivity.title} (${context.formatTime(context.nextActivity.startsAt)})`
              : "Aucune activité restante"}
          </strong>
        </div>

        {context.nextFreeSlot && (
          <div className="planning-summary-row">
            <span>Prochain temps libre</span>
            <strong>
              {context.nextFreeSlot.durationMinutes} min à partir de{" "}
              {context.formatTime(context.nextFreeSlot.startsAt)}
            </strong>
          </div>
        )}
      </div>

      <Button variant="secondary" size="sm" onClick={context.onOpenPlanning}>
        Voir le planning complet
      </Button>
    </section>
  );
}
