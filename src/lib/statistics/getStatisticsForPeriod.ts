import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { DailyCheckinRecord } from "../../types/dailyCheckin";
import {
  getPeriodBounds,
  type StatisticsPeriod,
} from "../time/periodBounds";
import { aggregateWorkoutStatistics } from "./aggregateWorkoutStatistics";
import { aggregateStudyStatistics } from "./aggregateStudyStatistics";
import {
  aggregateCompletionStatistics,
  aggregateLeisureStatistics,
  aggregateSpiritualStatistics,
  aggregateWellnessStatistics,
} from "./aggregateCompletionStatistics";

export type PeriodStatistics = {
  period: StatisticsPeriod;
  label: string;
  start: string;
  end: string;
  previousLabel: string;
  workout: ReturnType<typeof aggregateWorkoutStatistics>;
  study: ReturnType<typeof aggregateStudyStatistics>;
  completion: ReturnType<typeof aggregateCompletionStatistics>;
  wellness: ReturnType<typeof aggregateWellnessStatistics>;
  spiritual: ReturnType<typeof aggregateSpiritualStatistics>;
  leisure: ReturnType<typeof aggregateLeisureStatistics>;
  hasData: boolean;
};

function inPeriod(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

function filterEventsForPeriod(
  events: TaskActivityEventRecord[],
  start: string,
  end: string,
): TaskActivityEventRecord[] {
  return events.filter((event) => inPeriod(event.occurred_at, start, end));
}

function filterCalendarForPeriod(
  items: CalendarItemRecord[],
  start: string,
  end: string,
): CalendarItemRecord[] {
  return items.filter(
    (item) =>
      inPeriod(item.starts_at, start, end) || inPeriod(item.ends_at, start, end),
  );
}

function filterCheckinsForPeriod(
  checkins: DailyCheckinRecord[],
  start: string,
  end: string,
): DailyCheckinRecord[] {
  return checkins.filter((item) => inPeriod(item.checkin_date, start.slice(0, 10), end.slice(0, 10)));
}

export function getStatisticsForPeriod({
  referenceDate,
  period,
  calendarItems,
  taskActivityEvents,
  checkins,
  studyWeeklyHours,
}: {
  referenceDate: string;
  period: StatisticsPeriod;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  checkins: DailyCheckinRecord[];
  studyWeeklyHours?: number;
}): PeriodStatistics {
  const bounds = getPeriodBounds(referenceDate, period);
  const events = filterEventsForPeriod(
    taskActivityEvents,
    bounds.start,
    bounds.end,
  );
  const items = filterCalendarForPeriod(calendarItems, bounds.start, bounds.end);
  const periodCheckins = filterCheckinsForPeriod(checkins, bounds.start, bounds.end);

  const workout = aggregateWorkoutStatistics({ events, calendarItems: items });
  const study = aggregateStudyStatistics({
    periodStart: bounds.start,
    periodEnd: bounds.end,
    calendarItems: items,
    taskActivityEvents: events,
    studyWeeklyHours,
  });
  const completion = aggregateCompletionStatistics({
    calendarItems: items,
    events,
  });
  const wellness = aggregateWellnessStatistics({ checkins: periodCheckins });
  const spiritual = aggregateSpiritualStatistics({ events });
  const leisure = aggregateLeisureStatistics({ events });

  const hasData =
    workout.sessionCount > 0 ||
    study.sessionCount > 0 ||
    completion.completedCount > 0 ||
    wellness.checkinDays > 0 ||
    spiritual.momentCount > 0 ||
    leisure.totalMinutes > 0;

  const previousBounds = getPeriodBounds(referenceDate, period);

  return {
    period,
    label: bounds.label,
    start: bounds.start,
    end: bounds.end,
    previousLabel: previousBounds.label,
    workout,
    study,
    completion,
    wellness,
    spiritual,
    leisure,
    hasData,
  };
}
