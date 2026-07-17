import { CALENDAR_COLORS, CALENDAR_LEGEND_ITEMS } from "../../config/calendarColors";

export function CalendarLegend() {
  return (
    <section className="calendar-legend" aria-label="Légende du calendrier">
      <h3>Légende</h3>
      <ul className="calendar-legend-list">
        {CALENDAR_LEGEND_ITEMS.map((category) => {
          const style = CALENDAR_COLORS[category];
          return (
            <li key={category}>
              <span
                className="calendar-legend-swatch"
                style={{ background: style.dot }}
                aria-hidden="true"
              />
              {style.icon && <span aria-hidden="true">{style.icon}</span>}
              {style.label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
