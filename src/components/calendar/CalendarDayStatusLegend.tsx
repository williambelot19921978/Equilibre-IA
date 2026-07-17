/** Légende des couleurs de cellule — rythme habituel du profil (Sprint 4.1). */

const DAY_STATUS_LEGEND = [
  { type: "work", label: "Travail", fill: "var(--day-work)", text: "var(--day-work-text)" },
  { type: "rest", label: "Repos", fill: "var(--day-rest)", text: "var(--day-rest-text)" },
  { type: "vacation", label: "Vacances", fill: "var(--day-vacation)", text: "var(--day-vacation-text)" },
  { type: "weekend", label: "Week-end", fill: "var(--day-weekend)", text: "var(--day-weekend-text)" },
  { type: "holiday", label: "Jour férié", fill: "var(--day-holiday)", text: "var(--day-holiday-text)" },
  { type: "travel", label: "Déplacement", fill: "var(--day-travel)", text: "var(--day-travel-text)" },
  { type: "special", label: "Journée spéciale", fill: "var(--day-special)", text: "var(--day-special-text)" },
] as const;

type CalendarDayStatusLegendProps = {
  compact?: boolean;
};

export function CalendarDayStatusLegend({ compact = false }: CalendarDayStatusLegendProps) {
  return (
    <section
      className={`calendar-day-status-legend${compact ? " calendar-day-status-legend-compact" : ""}`}
      aria-label="Légende du rythme habituel"
    >
      <h3 className="calendar-day-status-legend-title">
        {compact ? "Rythme habituel" : "Légende — rythme habituel"}
      </h3>
      <ul className="calendar-day-status-legend-list">
        {DAY_STATUS_LEGEND.map((item) => (
          <li key={item.type}>
            <span
              className="calendar-day-status-legend-swatch"
              style={{ background: item.fill, color: item.text }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
