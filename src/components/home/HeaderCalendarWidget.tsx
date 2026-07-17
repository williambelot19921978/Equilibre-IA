import { MonthCalendar } from "../calendar/MonthCalendar";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import type { HomeWidgetContext } from "../home/widgets/types";

export function HeaderCalendarWidget({
  context,
}: {
  context: HomeWidgetContext;
}) {
  const { goToRoute, AppRoutes } = useAppNavigation();

  return (
    <aside className="home-header-calendar" aria-label="Mini-calendrier">
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
      <button
        type="button"
        className="home-header-calendar-link"
        onClick={() => goToRoute(AppRoutes.CALENDAR)}
      >
        Ouvrir le calendrier
      </button>
    </aside>
  );
}
