import { MotivationCard } from "../MotivationCard";
import type { HomeWidgetContext } from "./types";

export function MotivationWidget({ context }: { context: HomeWidgetContext }) {
  const showCard =
    context.showSpiritualHomeCard ||
    (context.showSaintCalendar && context.memoryContext);

  if (!showCard || !context.memoryContext) return null;

  return (
    <section className="home-widget home-widget-motivation">
      <MotivationCard
        faithImportance={context.memoryContext.profile.faithImportance}
        faithContent={context.memoryContext.profile.faithContent}
        compact
        showSaintCalendar={context.showSaintCalendar}
        showSpiritualActions={
          context.memoryContext.profile.faithImportance !== "disabled"
        }
        onOpenSpiritualSpace={context.onOpenSpiritual}
        onAddCalmMoment={
          context.memoryContext.profile.faithImportance !== "disabled"
            ? context.onAddCalmMoment
            : undefined
        }
      />
    </section>
  );
}
