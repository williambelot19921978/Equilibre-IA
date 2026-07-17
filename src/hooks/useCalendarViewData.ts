import { useCallback, useEffect, useRef, useState } from "react";

import { getActivePeriodsForDate } from "../ai/familyContextEngine";
import {
  mergeCalendarItemsById,
  shouldApplyRequest,
} from "../lib/calendar/calendarViewStability";
import type { MonthDisplayEvent } from "../lib/planning/monthEventLayout";
import type { LocalDateString } from "../lib/time/localDate";
import { parseLocalDateParts } from "../lib/time/localDate";
import { loadMonthDisplayData } from "../services/calendarMonthDisplayService";
import type { MonthOverviewData } from "../services/calendarMonthDataService";
import { loadActiveAndFuturePeriods } from "../services/familyContextService";
import { getCurrentHouseholdId } from "../services/householdService";
import { loadDailyRoutine } from "../services/dailyRoutineService";
import { getProfileFacts } from "../services/profileFactsService";
import { extractWorkDaysFromFacts } from "../lib/profile/extractWorkDays";
import { loadActiveWorkSchedulePattern } from "../services/workScheduleService";
import type { WorkSchedulePatternData } from "../types/workSchedule";
import { loadCalendarItemsForDate } from "../services/planningService";
import type { CalendarItemRecord } from "../types";
import type { FamilyContextPeriodRecord } from "../types/familyContext";

export type CalendarViewRefreshScope = "all" | "day" | "month" | "periods";

type CalendarViewDataState = {
  householdId: string | null;
  householdError: string;
  calendarItems: CalendarItemRecord[];
  calendarItemsError: string;
  periods: FamilyContextPeriodRecord[];
  periodsError: string;
  monthOverview: MonthOverviewData;
  displayEvents: MonthDisplayEvent[];
  markedDates: string[];
  monthError: string;
  workDays: string[];
  workSchedulePattern: WorkSchedulePatternData | null;
  isBootstrapping: boolean;
  isRefreshingDay: boolean;
  isRefreshingMonth: boolean;
};

const INITIAL_STATE: CalendarViewDataState = {
  householdId: null,
  householdError: "",
  calendarItems: [],
  calendarItemsError: "",
  periods: [],
  periodsError: "",
  monthOverview: {},
  displayEvents: [],
  markedDates: [],
  monthError: "",
  workDays: [],
  workSchedulePattern: null,
  isBootstrapping: true,
  isRefreshingDay: false,
  isRefreshingMonth: false,
};

function buildMarkedDates(overview: MonthOverviewData): string[] {
  return Object.values(overview)
    .filter((day) => day.items.length > 0 || day.vacations.length > 0)
    .map((day) => day.date);
}

export function useCalendarViewData({
  userId,
  selectedDate,
}: {
  userId: string | undefined;
  selectedDate: LocalDateString;
}) {
  const [state, setState] = useState<CalendarViewDataState>(INITIAL_STATE);
  const [visibleYear, setVisibleYear] = useState(
    () => parseLocalDateParts(selectedDate).year,
  );
  const [visibleMonth, setVisibleMonth] = useState(
    () => parseLocalDateParts(selectedDate).month,
  );
  const [periodsRevision, setPeriodsRevision] = useState(0);
  const [workDaysRevision, setWorkDaysRevision] = useState(0);

  const periodsRef = useRef<FamilyContextPeriodRecord[]>([]);
  const workDaysRef = useRef<string[]>([]);
  const dayRequestIdRef = useRef(0);
  const monthRequestIdRef = useRef(0);
  const bootstrapRequestIdRef = useRef(0);

  useEffect(() => {
    const { year, month } = parseLocalDateParts(selectedDate);
    setVisibleYear(year);
    setVisibleMonth(month);
  }, [selectedDate]);

  useEffect(() => {
    if (!userId) {
      setState({ ...INITIAL_STATE, isBootstrapping: false });
      return;
    }

    const requestId = ++bootstrapRequestIdRef.current;
    let cancelled = false;

    async function bootstrap() {
      setState((current) => ({
        ...current,
        isBootstrapping: true,
        householdError: "",
      }));

      try {
        const activeUserId = userId as string;
        const householdId = await getCurrentHouseholdId(activeUserId);
        if (
          cancelled ||
          !shouldApplyRequest(requestId, bootstrapRequestIdRef.current)
        ) {
          return;
        }

        const periods = await loadActiveAndFuturePeriods(householdId);
        const [routine, facts, pattern] = await Promise.all([
          loadDailyRoutine(activeUserId),
          getProfileFacts(activeUserId),
          loadActiveWorkSchedulePattern(activeUserId).catch(() => null),
        ]);
        const resolvedWorkDays =
          extractWorkDaysFromFacts(facts).length > 0
            ? extractWorkDaysFromFacts(facts)
            : routine.workDays;
        if (
          cancelled ||
          !shouldApplyRequest(requestId, bootstrapRequestIdRef.current)
        ) {
          return;
        }

        periodsRef.current = periods;
        workDaysRef.current = resolvedWorkDays;
        setPeriodsRevision((value) => value + 1);
        setWorkDaysRevision((value) => value + 1);
        setState((current) => ({
          ...current,
          householdId,
          householdError: "",
          periods,
          periodsError: "",
          workDays: resolvedWorkDays,
          workSchedulePattern: pattern,
        }));
      } catch (error) {
        if (
          cancelled ||
          !shouldApplyRequest(requestId, bootstrapRequestIdRef.current)
        ) {
          return;
        }

        setState((current) => ({
          ...current,
          householdId: null,
          householdError:
            error instanceof Error
              ? error.message
              : "Aucun foyer trouvé pour cet utilisateur.",
        }));
      } finally {
        if (
          !cancelled &&
          shouldApplyRequest(requestId, bootstrapRequestIdRef.current)
        ) {
          setState((current) => ({ ...current, isBootstrapping: false }));
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !state.householdId) return;

    const activeUserId = userId;
    const activeHouseholdId = state.householdId;
    const requestId = ++dayRequestIdRef.current;
    let cancelled = false;

    async function loadDay() {
      setState((current) => ({
        ...current,
        isRefreshingDay: current.calendarItems.length === 0,
        calendarItemsError: "",
      }));

      try {
        const loaded = await loadCalendarItemsForDate({
          userId: activeUserId,
          householdId: activeHouseholdId,
          date: selectedDate,
        });

        if (cancelled || !shouldApplyRequest(requestId, dayRequestIdRef.current)) {
          return;
        }

        setState((current) => ({
          ...current,
          calendarItems: loaded,
          calendarItemsError: "",
          isRefreshingDay: false,
        }));
      } catch (error) {
        if (cancelled || !shouldApplyRequest(requestId, dayRequestIdRef.current)) {
          return;
        }

        setState((current) => ({
          ...current,
          calendarItemsError:
            error instanceof Error
              ? error.message
              : "Impossible de charger les éléments du calendrier.",
          isRefreshingDay: false,
        }));
      }
    }

    void loadDay();

    return () => {
      cancelled = true;
    };
  }, [userId, state.householdId, selectedDate]);

  useEffect(() => {
    if (!userId || !state.householdId) return;

    const activeUserId = userId;
    const activeHouseholdId = state.householdId;
    const requestId = ++monthRequestIdRef.current;
    let cancelled = false;

    async function loadMonth() {
      setState((current) => ({
        ...current,
        isRefreshingMonth: Object.keys(current.monthOverview).length === 0,
        monthError: "",
      }));

      try {
        const { overview, displayEvents } = await loadMonthDisplayData({
          userId: activeUserId,
          householdId: activeHouseholdId,
          year: visibleYear,
          month: visibleMonth,
          periods: periodsRef.current,
          workDays: workDaysRef.current,
        });

        if (
          cancelled ||
          !shouldApplyRequest(requestId, monthRequestIdRef.current)
        ) {
          return;
        }

        setState((current) => ({
          ...current,
          monthOverview: overview,
          displayEvents,
          markedDates: buildMarkedDates(overview),
          monthError: "",
          isRefreshingMonth: false,
        }));
      } catch (error) {
        if (
          cancelled ||
          !shouldApplyRequest(requestId, monthRequestIdRef.current)
        ) {
          return;
        }

        setState((current) => ({
          ...current,
          monthError:
            error instanceof Error
              ? error.message
              : "Impossible de charger le calendrier mensuel.",
          isRefreshingMonth: false,
        }));
      }
    }

    void loadMonth();

    return () => {
      cancelled = true;
    };
  }, [userId, state.householdId, visibleYear, visibleMonth, periodsRevision, workDaysRevision]);

  const handleVisibleMonthChange = useCallback((year: number, month: number) => {
    setVisibleYear(year);
    setVisibleMonth(month);
  }, []);

  const refresh = useCallback(
    async (scope: CalendarViewRefreshScope = "all") => {
      if (!userId || !state.householdId) return;

      if (scope === "periods" || scope === "all") {
        try {
          const periods = await loadActiveAndFuturePeriods(state.householdId);
          periodsRef.current = periods;
          setPeriodsRevision((value) => value + 1);
          setState((current) => ({
            ...current,
            periods,
            periodsError: "",
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            periodsError:
              error instanceof Error
                ? error.message
                : "Impossible de charger les périodes de contexte.",
          }));
        }
      }

      if (scope === "all") {
        try {
          const [routine, facts, pattern] = await Promise.all([
            loadDailyRoutine(userId),
            getProfileFacts(userId),
            loadActiveWorkSchedulePattern(userId).catch(() => null),
          ]);
          const resolvedWorkDays =
            extractWorkDaysFromFacts(facts).length > 0
              ? extractWorkDaysFromFacts(facts)
              : routine.workDays;
          workDaysRef.current = resolvedWorkDays;
          setWorkDaysRevision((value) => value + 1);
          setState((current) => ({
            ...current,
            workDays: resolvedWorkDays,
            workSchedulePattern: pattern,
          }));
        } catch {
          // Non-blocking — le calendrier garde le dernier rythme connu.
        }
      }

      if (scope === "day" || scope === "all") {
        const requestId = ++dayRequestIdRef.current;
        setState((current) => ({
          ...current,
          isRefreshingDay: true,
          calendarItemsError: "",
        }));

        try {
          const loaded = await loadCalendarItemsForDate({
            userId,
            householdId: state.householdId,
            date: selectedDate,
          });

          if (!shouldApplyRequest(requestId, dayRequestIdRef.current)) return;

          setState((current) => ({
            ...current,
            calendarItems: loaded,
            calendarItemsError: "",
            isRefreshingDay: false,
          }));
        } catch (error) {
          if (!shouldApplyRequest(requestId, dayRequestIdRef.current)) return;

          setState((current) => ({
            ...current,
            calendarItemsError:
              error instanceof Error
                ? error.message
                : "Impossible de charger les éléments du calendrier.",
            isRefreshingDay: false,
          }));
        }
      }

      if (scope === "month" || scope === "all") {
        const requestId = ++monthRequestIdRef.current;
        setState((current) => ({
          ...current,
          isRefreshingMonth: true,
          monthError: "",
        }));

        try {
          const { overview, displayEvents } = await loadMonthDisplayData({
            userId,
            householdId: state.householdId,
            year: visibleYear,
            month: visibleMonth,
            periods: periodsRef.current,
            workDays: workDaysRef.current,
          });

          if (!shouldApplyRequest(requestId, monthRequestIdRef.current)) return;

          setState((current) => ({
            ...current,
            monthOverview: overview,
            displayEvents,
            markedDates: buildMarkedDates(overview),
            monthError: "",
            isRefreshingMonth: false,
          }));
        } catch (error) {
          if (!shouldApplyRequest(requestId, monthRequestIdRef.current)) return;

          setState((current) => ({
            ...current,
            monthError:
              error instanceof Error
                ? error.message
                : "Impossible de charger le calendrier mensuel.",
            isRefreshingMonth: false,
          }));
        }
      }
    },
    [userId, state.householdId, selectedDate, visibleYear, visibleMonth],
  );

  const upsertCalendarItem = useCallback((item: CalendarItemRecord) => {
    setState((current) => ({
      ...current,
      calendarItems: mergeCalendarItemsById(current.calendarItems, [item]),
    }));
  }, []);

  const removeCalendarItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      calendarItems: current.calendarItems.filter((item) => item.id !== itemId),
    }));
  }, []);

  const activePeriodsForDate = getActivePeriodsForDate(
    state.periods,
    selectedDate,
  );

  return {
    ...state,
    visibleYear,
    visibleMonth,
    activePeriodsForDate,
    handleVisibleMonthChange,
    refresh,
    upsertCalendarItem,
    removeCalendarItem,
  };
}
