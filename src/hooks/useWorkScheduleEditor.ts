import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { previewWorkSchedule } from "../lib/work/resolveWorkStatusForDate";
import { getMondayOfWeek } from "../lib/work/workScheduleCycle";
import {
  buildAlternatingWeeksPattern,
  buildCyclePattern,
} from "../lib/work/workScheduleBuilders";
import {
  applyScheduleModeChange,
  hydrateEditorFromPattern,
  type ScheduleMode,
  type WorkScheduleEditorState,
} from "../lib/work/workScheduleEditorState";
import {
  loadActiveWorkSchedulePattern,
  saveWorkSchedulePattern,
} from "../services/workScheduleService";
import {
  createDefaultFixedPattern,
  type CompensatoryRestRule,
  type WorkSchedulePatternData,
} from "../types/workSchedule";

export function useWorkScheduleEditor({
  userId,
  workDays,
  workStart = "09:00",
  workEnd = "17:00",
  commuteMinutes,
}: {
  userId: string;
  workDays: string[];
  workStart?: string;
  workEnd?: string;
  commuteMinutes?: number;
}) {
  const workDaysKey = workDays.join(",");
  const defaultReferenceWeek = getMondayOfWeek(
    new Date().toISOString().slice(0, 10),
  );

  const [state, setState] = useState<WorkScheduleEditorState>(() =>
    hydrateEditorFromPattern(null, workDays, workStart, workEnd, defaultReferenceWeek),
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const userTouchedRef = useRef(false);

  const loadPattern = useCallback(async () => {
    try {
      setError("");
      const pattern = await loadActiveWorkSchedulePattern(userId);
      if (!userTouchedRef.current) {
        setState(
          hydrateEditorFromPattern(
            pattern,
            workDays,
            workStart,
            workEnd,
            defaultReferenceWeek,
          ),
        );
      }
      setLoaded(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger ton rythme de travail.",
      );
      setLoaded(true);
    }
  }, [userId, workStart, workEnd, defaultReferenceWeek, workDaysKey]);

  useEffect(() => {
    userTouchedRef.current = false;
    setLoaded(false);
    void loadPattern();
  }, [userId, loadPattern]);

  const setMode = useCallback((mode: ScheduleMode) => {
    userTouchedRef.current = true;
    setState((current) => applyScheduleModeChange(current, mode));
  }, []);

  const draftPattern = useMemo((): WorkSchedulePatternData => {
    const compensatoryRules: CompensatoryRestRule[] = [
      {
        whenWorkWeekday: state.compensatoryWhen,
        restWeekday: state.compensatoryDay,
      },
    ];

    if (state.mode === "fixed_week") {
      const fixed = createDefaultFixedPattern(workDays, workStart, workEnd);
      return { ...fixed, weeklyPatterns: [state.weekA], commuteMinutes };
    }

    if (state.mode === "alternating_weeks") {
      return buildAlternatingWeeksPattern({
        weekA: state.weekA,
        weekB: state.weekB,
        compensatoryRules,
        effectiveFrom: state.referenceWeek,
        referenceWeek: state.referenceWeek,
        defaultStartTime: workStart,
        defaultEndTime: workEnd,
        commuteMinutes,
      });
    }

    return buildCyclePattern({
      weeks: state.cycleWeeks,
      effectiveFrom: state.referenceWeek,
      referenceWeek: state.referenceWeek,
      compensatoryRules,
      defaultStartTime: workStart,
      defaultEndTime: workEnd,
      commuteMinutes,
    });
  }, [state, workDays, workStart, workEnd, commuteMinutes]);

  const preview = useMemo(
    () =>
      previewWorkSchedule({
        startDate: state.referenceWeek,
        weekCount: 6,
        fixedWorkDays: workDays,
        workSchedulePattern: draftPattern,
      }),
    [state.referenceWeek, workDays, draftPattern],
  );

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");
      await saveWorkSchedulePattern({ userId, pattern: draftPattern });
      userTouchedRef.current = false;
      setMessage("Rythme de travail enregistré.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer le rythme de travail.",
      );
    } finally {
      setSaving(false);
    }
  }, [userId, draftPattern]);

  return {
    state,
    setState: (updater: (current: WorkScheduleEditorState) => WorkScheduleEditorState) => {
      userTouchedRef.current = true;
      setState(updater);
    },
    setMode,
    draftPattern,
    preview,
    loaded,
    saving,
    message,
    error,
    save,
  };
}
