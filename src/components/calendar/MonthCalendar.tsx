import { useCallback, useEffect, useMemo, useState } from "react";

import { CALENDAR_COLORS } from "../../config/calendarColors";
import type { CalendarFilterId } from "../../config/calendarFilters";
import { resolveDayCellVisual } from "../../design-system/dayCellVisual";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { CalendarDayOverride } from "../../lib/calendar/resolveCalendarDayStatus";
import {
  formatMonthYear,
  getTodayDateString,
} from "../../lib/navigation/urlDate";
import { formatDeviceTime } from "../../lib/time/deviceClock";
import { filterMonthDisplayEvents } from "../../lib/planning/buildMonthDisplayEvents";
import {
  getSingleDayEventsForDate,
  layoutMonthEventBars,
  type MonthDisplayEvent,
  type MonthEventBarSegment,
} from "../../lib/planning/monthEventLayout";
import type {
  MonthDayData,
  MonthDayPreviewItem,
  MonthOverviewData,
} from "../../services/calendarMonthDataService";
import { Button } from "../ui/Button";
import { MonthEventBar } from "./MonthEventBar";

export type MonthCalendarVariant = "compact" | "full" | "drawer" | "planningCompact";

type MonthCalendarProps = {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  variant?: MonthCalendarVariant;
  markedDates?: string[];
  monthOverview?: MonthOverviewData;
  displayEvents?: MonthDisplayEvent[];
  activeFilter?: CalendarFilterId;
  visibleYear?: number;
  visibleMonth?: number;
  onVisibleMonthChange?: (year: number, month: number) => void;
  onEventClick?: (item: MonthDayPreviewItem, date: string) => void;
  onDisplayEventClick?: (event: MonthDisplayEvent, date: string) => void;
  onVacationClick?: (periodId: string, date: string) => void;
  onOverflowClick?: (date: string) => void;
  workDays?: string[];
  workSchedulePattern?: import("../../types/workSchedule").WorkSchedulePatternData | null;
  contextPeriods?: FamilyContextPeriodRecord[];
  holidays?: string[];
  dayOverrides?: CalendarDayOverride[];
};

function getWeekdayHeaders(compact: boolean): string[] {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: compact ? "narrow" : "short",
  });
  const monday = new Date(2026, 0, 5);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return formatter.format(day);
  });
}

function renderCompactMarkers(
  dayData: MonthDayData | undefined,
  singleDayEvents: MonthDisplayEvent[],
) {
  const categories =
    dayData?.colorCategories ??
    singleDayEvents.map((event) => event.colorCategory);

  if (categories.length === 0) return null;

  const hasBirthday = singleDayEvents.some(
    (event) => event.source === "birthday" || event.colorCategory === "birthday",
  );

  return (
    <span className="month-calendar-dots" aria-hidden="true">
      {categories.slice(0, 3).map((category) => (
        <span
          key={category}
          className="month-calendar-dot"
          style={{ background: CALENDAR_COLORS[category].dot }}
        />
      ))}
      {hasBirthday && (
        <span className="month-calendar-birthday-icon" aria-hidden="true">
          🎂
        </span>
      )}
    </span>
  );
}

function SingleDayChip({
  event,
  date,
  compact,
  onClick,
}: {
  event: MonthDisplayEvent;
  date: string;
  compact: boolean;
  onClick?: (event: MonthDisplayEvent, date: string) => void;
}) {
  const colors = CALENDAR_COLORS[event.colorCategory];
  const timeLabel = event.startsAt ? formatDeviceTime(event.startsAt) : "";

  return (
    <button
      type="button"
      className={`month-calendar-single-event${compact ? " month-calendar-single-event-compact" : ""}`}
      style={{
        background: colors.background,
        color: colors.text,
        borderColor: colors.border,
      }}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick?.(event, date);
      }}
      title={event.title}
    >
      {!compact && timeLabel && (
        <span className="month-calendar-event-time">{timeLabel}</span>
      )}
      <span className="month-calendar-event-title">{event.title}</span>
    </button>
  );
}

export function MonthCalendar({
  selectedDate,
  onDateSelect,
  variant = "full",
  markedDates = [],
  monthOverview,
  displayEvents = [],
  activeFilter = "all",
  visibleYear: visibleYearProp,
  visibleMonth: visibleMonthProp,
  onVisibleMonthChange,
  onDisplayEventClick,
  onVacationClick,
  onOverflowClick,
  workDays = [],
  workSchedulePattern = null,
  contextPeriods = [],
  holidays = [],
  dayOverrides = [],
}: MonthCalendarProps) {
  const drawer = variant === "drawer";
  const planningCompact = variant === "planningCompact";
  const compact = variant === "compact" || drawer || planningCompact;
  const weekdayCompact = variant === "compact" || planningCompact;
  const today = getTodayDateString();
  const initial = useMemo(
    () => new Date(`${selectedDate}T12:00:00`),
    [selectedDate],
  );
  const isControlled =
    visibleYearProp !== undefined && visibleMonthProp !== undefined;
  const [internalYear, setInternalYear] = useState(initial.getFullYear());
  const [internalMonth, setInternalMonth] = useState(initial.getMonth());

  const visibleYear = isControlled ? visibleYearProp : internalYear;
  const visibleMonth = isControlled ? visibleMonthProp : internalMonth;

  const setMonthView = useCallback(
    (year: number, month: number) => {
      if (!isControlled) {
        setInternalYear(year);
        setInternalMonth(month);
      }
      onVisibleMonthChange?.(year, month);
    },
    [isControlled, onVisibleMonthChange],
  );

  useEffect(() => {
    if (isControlled) return;
    const date = new Date(`${selectedDate}T12:00:00`);
    setInternalYear(date.getFullYear());
    setInternalMonth(date.getMonth());
  }, [selectedDate, isControlled]);

  const markedSet = useMemo(() => new Set(markedDates), [markedDates]);
  const filteredEvents = useMemo(
    () => filterMonthDisplayEvents(displayEvents, activeFilter),
    [displayEvents, activeFilter],
  );

  const weekLayouts = useMemo(
    () =>
      layoutMonthEventBars({
        year: visibleYear,
        month: visibleMonth,
        events: filteredEvents,
        maxLanes: compact ? 2 : 3,
      }),
    [visibleYear, visibleMonth, filteredEvents, compact],
  );

  const weekdayHeaders = getWeekdayHeaders(weekdayCompact);

  const goToPreviousMonth = useCallback(() => {
    const nextMonth = visibleMonth === 0 ? 11 : visibleMonth - 1;
    const nextYear = visibleMonth === 0 ? visibleYear - 1 : visibleYear;
    setMonthView(nextYear, nextMonth);
  }, [visibleMonth, visibleYear, setMonthView]);

  const goToNextMonth = useCallback(() => {
    const nextMonth = visibleMonth === 11 ? 0 : visibleMonth + 1;
    const nextYear = visibleMonth === 11 ? visibleYear + 1 : visibleYear;
    setMonthView(nextYear, nextMonth);
  }, [visibleMonth, visibleYear, setMonthView]);

  function handleBarClick(segment: MonthEventBarSegment) {
    const date =
      segment.event.startDate >= `${visibleYear}-${String(visibleMonth + 1).padStart(2, "0")}-01`
        ? segment.event.startDate
        : selectedDate;
    onDisplayEventClick?.(segment.event, date);

    if (segment.source === "vacation" && segment.event.metadata?.periodId) {
      onVacationClick?.(String(segment.event.metadata.periodId), date);
    }
  }

  return (
    <section
      className={[
        "month-calendar",
        drawer
          ? "month-calendar-drawer"
          : planningCompact
            ? "month-calendar-planning-compact"
            : compact
            ? "month-calendar-compact"
            : "month-calendar-full",
        displayEvents.length > 0 ? "month-calendar-week-layout" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Calendrier mensuel"
    >
      <div className="month-calendar-header">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Mois précédent"
          onClick={goToPreviousMonth}
        >
          ←
        </Button>

        <h2>{formatMonthYear(visibleYear, visibleMonth)}</h2>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Mois suivant"
          onClick={goToNextMonth}
        >
          →
        </Button>
      </div>

      <div className="month-calendar-weekdays" aria-hidden="true">
        {weekdayHeaders.map((label, index) => (
          <span key={`weekday-${index}`}>{label}</span>
        ))}
      </div>

      <div className="month-calendar-weeks">
        {weekLayouts.map((week) => (
          <div className="month-calendar-week" key={`week-${week.weekIndex}`}>
            <div className="month-calendar-week-days" role="row">
              {week.days.map((date, index) => {
                if (!date) {
                  return (
                    <span
                      className="month-calendar-empty"
                      key={`empty-${week.weekIndex}-${index}`}
                    />
                  );
                }

                const dayNumber = new Date(`${date}T12:00:00`).getDate();
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const dayData = monthOverview?.[date];
                const cellVisual = resolveDayCellVisual(date, {
                  workDays,
                  workSchedulePattern,
                  contextPeriods,
                  holidays,
                  overrides: dayOverrides,
                  dayData,
                });
                const { visible, hiddenCount } = getSingleDayEventsForDate({
                  date,
                  events: filteredEvents,
                  maxVisible: compact ? 1 : 2,
                });
                const hasMarker =
                  markedSet.has(date) ||
                  Boolean(dayData?.items.length) ||
                  visible.length > 0 ||
                  week.bars.some(
                    (bar) => date >= bar.event.startDate && date <= bar.event.endDate,
                  );

                return (
                  <div
                    key={date}
                    role="gridcell"
                    tabIndex={0}
                    className={[
                      "month-calendar-day",
                      `month-calendar-day-${cellVisual.type}`,
                      isToday ? "month-calendar-today" : "",
                      isSelected ? "month-calendar-selected" : "",
                      hasMarker ? "month-calendar-marked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      background: cellVisual.type !== "default" ? cellVisual.fill : undefined,
                      color: cellVisual.text,
                    }}
                    aria-label={`${dayNumber}${hasMarker ? ", avec événements" : ""}${isToday ? ", aujourd'hui" : ""}`}
                    aria-selected={isSelected}
                    onClick={() => onDateSelect(date)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onDateSelect(date);
                      }
                    }}
                  >
                    <span className="month-calendar-day-number">{dayNumber}</span>
                    {(cellVisual.icon || (dayData?.colorCategories.length ?? 0) > 0) && compact && (
                      <span className="month-calendar-day-badges" aria-hidden="true">
                        {cellVisual.icon && (
                          <span className="month-calendar-day-icon">{cellVisual.icon}</span>
                        )}
                        {(dayData?.colorCategories ?? []).slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="month-calendar-day-badge"
                            style={{ color: CALENDAR_COLORS[cat].dot }}
                          />
                        ))}
                      </span>
                    )}
                    {compact ? (
                      !cellVisual.icon &&
                      (dayData?.colorCategories.length ?? 0) === 0 &&
                      renderCompactMarkers(dayData, visible)
                    ) : (
                      visible.map((event) => (
                        <SingleDayChip
                          key={event.id}
                          event={event}
                          date={date}
                          compact={compact}
                          onClick={onDisplayEventClick}
                        />
                      ))
                    )}
                    {!compact && hiddenCount > 0 && (
                      <button
                        type="button"
                        className="month-calendar-overflow-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOverflowClick?.(date);
                        }}
                      >
                        +{hiddenCount}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {week.bars.length > 0 && (
              <div
                className="month-calendar-week-bars"
                style={{
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: `repeat(${Math.max(...week.bars.map((bar) => bar.lane), 0) + 1}, 18px)`,
                }}
              >
                {week.bars.map((segment) => (
                  <MonthEventBar
                    key={`${segment.eventId}-${segment.startCol}-${segment.lane}`}
                    segment={segment}
                    onClick={handleBarClick}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
