import { CALENDAR_COLORS } from "../../config/calendarColors";
import type { MonthDisplayEvent } from "../../lib/planning/monthEventLayout";
import { formatDateLabel } from "../../lib/navigation/urlDate";

type MonthUpcomingSummaryProps = {
  events: MonthDisplayEvent[];
  fromDate: string;
  onEventClick?: (event: MonthDisplayEvent) => void;
};

export function MonthUpcomingSummary({
  events,
  fromDate,
  onEventClick,
}: MonthUpcomingSummaryProps) {
  const highlights = events
    .filter((event) => event.startDate >= fromDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);

  if (highlights.length === 0) {
    return (
      <section className="month-upcoming-summary">
        <h3>À venir ce mois-ci</h3>
        <p className="planning-hint">Aucun événement important prévu.</p>
      </section>
    );
  }

  return (
    <section className="month-upcoming-summary">
      <h3>À venir ce mois-ci</h3>
      <ul className="month-upcoming-list">
        {highlights.map((event) => {
          const colors = CALENDAR_COLORS[event.colorCategory];
          return (
            <li key={event.id}>
              <button
                type="button"
                className="month-upcoming-item"
                onClick={() => onEventClick?.(event)}
              >
                <span
                  className="month-upcoming-dot"
                  style={{ background: colors.dot }}
                  aria-hidden="true"
                />
                <span>
                  <strong>{event.title}</strong>
                  <small>{formatDateLabel(event.startDate)}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
