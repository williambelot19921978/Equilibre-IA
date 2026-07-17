import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { MonthCalendar } from "../calendar/MonthCalendar";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useCalendarViewData } from "../../hooks/useCalendarViewData";
import { AppRoutes } from "../../lib/navigation/routes";
import { getTodayDateString } from "../../lib/navigation/urlDate";

type DrawerCalendarSectionProps = {
  onClose: () => void;
};

export function DrawerCalendarSection({ onClose }: DrawerCalendarSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const selectedDate = getTodayDateString();
  const {
    markedDates,
    monthOverview,
    displayEvents,
    workDays,
    workSchedulePattern,
    periods,
    visibleYear,
    visibleMonth,
    handleVisibleMonthChange,
    isBootstrapping,
  } = useCalendarViewData({ userId: user?.id, selectedDate });

  const handleDateSelect = useCallback(
    (date: string) => {
      const params = new URLSearchParams();
      if (date !== getTodayDateString()) {
        params.set("date", date);
      }
      const query = params.toString();
      navigate(query ? `${AppRoutes.HOME}?${query}` : AppRoutes.HOME);
      onClose();
    },
    [navigate, onClose],
  );

  return (
    <section className="app-drawer-calendar" aria-label="Mini-calendrier">
      <div className="app-drawer-calendar-header">
        <h2>Calendrier</h2>
      </div>

      {isBootstrapping ? (
        <p className="app-drawer-calendar-loading">Chargement du calendrier…</p>
      ) : (
        <MonthCalendar
          variant="drawer"
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          markedDates={markedDates}
          monthOverview={monthOverview}
          displayEvents={displayEvents}
          workDays={workDays}
          workSchedulePattern={workSchedulePattern}
          contextPeriods={periods}
          visibleYear={visibleYear}
          visibleMonth={visibleMonth}
          onVisibleMonthChange={handleVisibleMonthChange}
          onDisplayEventClick={(_, date) => handleDateSelect(date)}
        />
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        className="app-drawer-calendar-link-btn"
        onClick={() => {
          navigate(AppRoutes.CALENDAR);
          onClose();
        }}
      >
        Ouvrir le calendrier
      </Button>
    </section>
  );
}
