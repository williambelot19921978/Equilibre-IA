import { Button } from "../../ui/Button";
import type { HomeWidgetId } from "../../../types/homePreferences";
import type { HomeWidgetContext } from "./types";

function getPriorityLabel(priority: "high" | "medium" | "low") {
  if (priority === "high") return "Prioritaire";
  if (priority === "medium") return "Utile";
  return "À découvrir";
}

export function MemoryInsightsWidget({
  context,
  widgetId,
}: {
  context: HomeWidgetContext;
  widgetId: HomeWidgetId;
}) {
  if (widgetId === "profile_progress") {
    return (
      <section className="home-widget home-widget-progress">
        <div className="knowledge-card">
          <p className="card-label">Progression</p>
          <h2>Je te connais à {context.discoveryProgress.percentage} %</h2>
          <Button fullWidth onClick={context.onOpenDiscovery}>
            Continuer la découverte
          </Button>
        </div>
      </section>
    );
  }

  if (context.insights.length === 0) return null;

  return (
    <section className="home-widget home-widget-memory">
      <div className="section-heading">
        <h2>Ce que j&apos;ai compris</h2>
      </div>
      <div className="insight-list">
        {context.insights.slice(0, 3).map((insight) => (
          <article
            className={`insight-card priority-${insight.priority}`}
            key={insight.id}
          >
            <div className="insight-topline">
              <span>{getPriorityLabel(insight.priority)}</span>
              <small>{insight.category}</small>
            </div>
            <h3>{insight.title}</h3>
            <p>{insight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
