import { MonthCalendar } from "../../calendar/MonthCalendar";
import { CalendarDayStatusLegend } from "../../calendar/CalendarDayStatusLegend";
import type { HomeWidgetContext } from "./types";

export function CompactCalendarWidget({ context }: { context: HomeWidgetContext }) {
  return (
    <section className="home-widget home-widget-calendar">
      <div className="section-heading">
        <div>
          <p className="card-label">Calendrier</p>
          <h2>Vue du mois</h2>
        </div>
      </div>

      <div className="home-calendar-shell">
        <MonthCalendar
          variant="compact"
          selectedDate={context.selectedDate}
          onDateSelect={context.setSelectedDate}
          markedDates={context.markedDates}
          monthOverview={context.monthOverview}
          displayEvents={context.displayEvents}
          workDays={context.workDays}
          workSchedulePattern={context.workSchedulePattern}
          contextPeriods={context.contextPeriods}
          onDisplayEventClick={(_, date) => context.setSelectedDate(date)}
        />
      </div>

      <CalendarDayStatusLegend compact />

      {context.loadingMarkers && (
        <p className="planning-hint">Mise à jour des repères calendrier…</p>
      )}
    </section>
  );
}
