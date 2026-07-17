import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./useAuth";
import { useUrlDate } from "./useUrlDate";
import { useWorkoutPlayer } from "../contexts/WorkoutPlayerContext";
import {
  applyTimelineEditAndReplan,
} from "../services/blockAdjustmentService";
import { applyBlockAction } from "../services/blockActionService";
import {
  generateAndSaveDayPlan,
  loadDisplayedDayPlan,
} from "../services/planningService";
import { getPlanningErrorMessage } from "../types";
import type { CalendarItemRecord, DayPlan, PlanningResult } from "../types";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { TimelineBlockEditInput } from "../types/manualBlockAdjustment";
import type { NoTimeChoice, RescheduleOption } from "../types/taskActivity";
import type { LifeContext } from "../types/lifeContext";
import type { AchievementFeedback } from "../types/achievementFeedback";
import {
  canRegeneratePlan,
  type DayDisplayMode,
} from "../lib/planning/dayDisplayMode";
import {
  applySportProposalOverrides,
  buildSportProposalForEntry,
} from "../lib/planning/sportProposalAttachment";
import { loadPlanningContextForDate } from "../services/memoryContextService";
import { loadSportSettings } from "../services/homePreferencesService";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { subscribePlanRefresh } from "../lib/planning/planRefreshEvents";
import type { WorkoutOpenContext } from "../lib/workout/openWorkoutSessionForBlock";
import { acceptSportProposal } from "../services/sportProposalService";
import {
  attachWorkoutSessionToEntry,
  generateWorkoutForCalendarItem,
} from "../services/workoutSessionService";
import type { WorkoutCompletionOutcome } from "../components/planning/WorkoutSessionPlayer";
import type {
  WorkoutLevel,
  WorkoutSession,
  WorkoutSessionType,
} from "../types/workoutSession";
import { sessionsAreSimilar, adaptWorkoutSessionDuration } from "../ai/workoutGenerationEngine";

type SportEntryOptions = {
  levelOverride?: WorkoutLevel;
  typeOverride?: WorkoutSessionType;
  durationOverride?: number;
  forceDifferent?: boolean;
};

export function useDayPlan() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useUrlDate();
  const {
    handleStartWorkout,
    openPlayer,
    openingWorkout,
    sportMissingEntry,
    setSportMissingEntry,
    setWorkoutEntryHelpers,
    completeActiveWorkout: completeWorkoutInContext,
    isWorkoutPlayerOpen,
    activeWorkoutSession,
    activeWorkoutBlockId,
  } = useWorkoutPlayer();
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [baseTimeline, setBaseTimeline] = useState<DayTimelineEntry[]>([]);
  const [timeline, setTimeline] = useState<DayTimelineEntry[]>([]);
  const [items, setItems] = useState<CalendarItemRecord[]>([]);
  const [displayMode, setDisplayMode] = useState<DayDisplayMode>("live");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [sportSaving, setSportSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastEditExplanation, setLastEditExplanation] = useState("");
  const [lifeContext, setLifeContext] = useState<LifeContext | null>(null);
  const [sportProposalOverrides, setSportProposalOverrides] = useState<
    Record<string, WorkoutSession>
  >({});
  const [sportAlternateEntryId, setSportAlternateEntryId] = useState<
    string | null
  >(null);
  const [completingEntryId, setCompletingEntryId] = useState<string | null>(
    null,
  );
  const [cancellingEntryId, setCancellingEntryId] = useState<string | null>(
    null,
  );
  const [sportRecentSeeds, setSportRecentSeeds] = useState<
    Record<string, string[]>
  >({});
  const [recentAchievement, setRecentAchievement] =
    useState<AchievementFeedback | null>(null);

  const mergeTimelineOverrides = useCallback(
    (
      entries: DayTimelineEntry[],
      overrides: Record<string, WorkoutSession>,
    ) => applySportProposalOverrides(entries, overrides),
    [],
  );

  useEffect(() => {
    setTimeline(mergeTimelineOverrides(baseTimeline, sportProposalOverrides));
  }, [baseTimeline, sportProposalOverrides, mergeTimelineOverrides]);

  const loadPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setBaseTimeline([]);
      setTimeline([]);
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const displayed = await loadDisplayedDayPlan({
        userId: user.id,
        date: selectedDate,
      });

      if (!displayed) {
        setPlan(null);
        setBaseTimeline([]);
        setTimeline([]);
        setItems([]);
        setLifeContext(null);
        return;
      }

      setPlan(displayed.plan);
      setBaseTimeline(displayed.timeline);
      setItems(displayed.items);
      setDisplayMode(displayed.displayMode);
      setLifeContext(displayed.lifeContext ?? null);
    } catch (loadError) {
      setError(getPlanningErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    return subscribePlanRefresh((dates) => {
      if (dates.includes(selectedDate)) {
        void loadPlan();
      }
    });
  }, [selectedDate, loadPlan]);

  useEffect(() => {
    setSportProposalOverrides({});
    setSportAlternateEntryId(null);
    setSportRecentSeeds({});
  }, [selectedDate]);

  const regenerateSportProposal = useCallback(
    async (entry: DayTimelineEntry, options: SportEntryOptions = {}) => {
      if (!user) return;

      const planningContext = await loadPlanningContextForDate({
        userId: user.id,
        date: selectedDate,
      });
      const preferences = await loadSportSettings(user.id);
      const currentSession =
        sportProposalOverrides[entry.id] ?? entry.proposedWorkoutSession;
      const recentSeeds = [
        ...(sportRecentSeeds[entry.id] ?? []),
        ...(currentSession ? [currentSession.generationSeed] : []),
      ];

      if (options.durationOverride && currentSession) {
        const slotMinutes = Math.max(
          5,
          Math.round(
            (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
              60_000,
          ) - 5,
        );
        const session = adaptWorkoutSessionDuration(
          currentSession,
          options.durationOverride,
          slotMinutes,
        );
        setSportProposalOverrides((current) => ({
          ...current,
          [entry.id]: session,
        }));
        return;
      }

      let session = buildSportProposalForEntry({
        entry,
        planningContext: planningContext ?? undefined,
        lifeContext: lifeContext ?? undefined,
        preferences,
        recentSeeds,
        forceDifferent: options.forceDifferent ?? true,
        generationSeed: `${entry.id}-${Date.now()}`,
        levelOverride: options.levelOverride,
        typeOverride: options.typeOverride,
      });

      if (currentSession && sessionsAreSimilar(currentSession, session)) {
        session = buildSportProposalForEntry({
          entry,
          planningContext: planningContext ?? undefined,
          lifeContext: lifeContext ?? undefined,
          preferences,
          recentSeeds: [...recentSeeds, session.generationSeed],
          forceDifferent: true,
          generationSeed: `${entry.id}-${Date.now()}-alt`,
          levelOverride: options.levelOverride,
          typeOverride: options.typeOverride,
        });
      }

      setSportRecentSeeds((current) => ({
        ...current,
        [entry.id]: [...recentSeeds, session.generationSeed].slice(-8),
      }));

      setSportProposalOverrides((current) => ({
        ...current,
        [entry.id]: session,
      }));
      setSportAlternateEntryId(entry.id);
    },
    [user, selectedDate, lifeContext, sportProposalOverrides, sportRecentSeeds],
  );

  const acceptSportProposalEntry = useCallback(
    async (entry: DayTimelineEntry, session: WorkoutSession) => {
      if (!user) return;

      try {
        setSportSaving(true);
        setError("");
        const result = await acceptSportProposal({
          userId: user.id,
          date: selectedDate,
          entry,
          session,
        });

        setBaseTimeline(result.timeline);
        setLastEditExplanation(result.explanation);
        setSportProposalOverrides((current) => {
          const next = { ...current };
          delete next[entry.id];
          return next;
        });
        setSportAlternateEntryId(null);

        const displayed = await loadDisplayedDayPlan({
          userId: user.id,
          date: selectedDate,
        });
        if (displayed) {
          setPlan(displayed.plan);
          setItems(displayed.items);
          setBaseTimeline(displayed.timeline);
          setLifeContext(displayed.lifeContext ?? null);
        }

        openPlayer(entry, session);
      } catch (acceptError) {
        setError(getPlanningErrorMessage(acceptError));
      } finally {
        setSportSaving(false);
      }
    },
    [user, selectedDate, openPlayer],
  );

  const resolvePersistedWorkoutSession = useCallback(
    (entry: DayTimelineEntry): WorkoutSession | null => {
      if (entry.workoutSession) return entry.workoutSession;
      const item = items.find((candidate) => candidate.id === entry.calendarItemId);
      const session = item?.details?.workoutSession;
      return session && typeof session === "object"
        ? (session as WorkoutSession)
        : null;
    },
    [items],
  );

  const openWorkoutSessionForEntry = useCallback(
    (entry: DayTimelineEntry) => {
      handleStartWorkout(entry, resolvePersistedWorkoutSession(entry));
    },
    [handleStartWorkout, resolvePersistedWorkoutSession],
  );

  const startWorkoutSession = useCallback(
    (entry: DayTimelineEntry, session?: WorkoutSession) => {
      if (session) {
        openPlayer(entry, session);
        return;
      }
      openWorkoutSessionForEntry(entry);
    },
    [openPlayer, openWorkoutSessionForEntry],
  );

  const generateWorkoutForEntry = useCallback(
    async (entry: DayTimelineEntry) => {
      if (!user) return;

      try {
        setSportSaving(true);
        const session = await generateWorkoutForCalendarItem({ userId: user.id, entry });
        await attachWorkoutSessionToEntry({ userId: user.id, entry, session });
        await loadPlan();
        openPlayer(entry, session);
      } catch (generateError) {
        setError(getPlanningErrorMessage(generateError));
      } finally {
        setSportSaving(false);
      }
    },
    [user, loadPlan, openPlayer],
  );

  const completeActiveWorkout = useCallback(
    async (outcome: WorkoutCompletionOutcome) => {
      await completeWorkoutInContext(outcome);
    },
    [completeWorkoutInContext],
  );

  useEffect(() => {
    setWorkoutEntryHelpers({
      generateForEntry: generateWorkoutForEntry,
      regenerateForEntry: regenerateSportProposal,
      resolveWorkoutOpenContext: (): WorkoutOpenContext => ({
        currentLocalDate: getCurrentDeviceDate(),
        workoutCompletedToday: lifeContext?.workoutCompletedToday ?? false,
        scheduledSportEntries: timeline,
      }),
      onAchievement: (feedback) => {
        setRecentAchievement(feedback);
        setSportProposalOverrides({});
      },
      onAfterComplete: async (_outcome, result) => {
        await loadPlan();
        if (result?.explanation) {
          setLastEditExplanation(result.explanation);
        }
      },
    });
  }, [
    setWorkoutEntryHelpers,
    generateWorkoutForEntry,
    regenerateSportProposal,
    loadPlan,
    lifeContext,
    timeline,
  ]);

  const changeSportLevel = useCallback(
    async (entry: DayTimelineEntry, level: WorkoutLevel) => {
      await regenerateSportProposal(entry, { levelOverride: level, forceDifferent: true });
    },
    [regenerateSportProposal],
  );

  const changeSportType = useCallback(
    async (entry: DayTimelineEntry, type: WorkoutSessionType) => {
      await regenerateSportProposal(entry, { typeOverride: type, forceDifferent: true });
    },
    [regenerateSportProposal],
  );

  const changeSportDuration = useCallback(
    async (entry: DayTimelineEntry, durationMinutes: number) => {
      await regenerateSportProposal(entry, { durationOverride: durationMinutes });
    },
    [regenerateSportProposal],
  );

  const dismissSportAlternate = useCallback(() => {
    setSportAlternateEntryId(null);
  }, []);

  const generatePlan = useCallback(async (): Promise<PlanningResult | null> => {
    if (!user) return null;

    if (!canRegeneratePlan(displayMode)) {
      setError(
        "Cette journée passée est en lecture seule. Aucune régénération automatique.",
      );
      return null;
    }

    try {
      setGenerating(true);
      setError("");

      const { result, savedItems, plan: mergedPlan } =
        await generateAndSaveDayPlan({
          userId: user.id,
          date: selectedDate,
        });

      const displayed = await loadDisplayedDayPlan({
        userId: user.id,
        date: selectedDate,
      });

      setItems(savedItems);
      setPlan(displayed?.plan ?? mergedPlan);
      setBaseTimeline(displayed?.timeline ?? []);
      setLifeContext(displayed?.lifeContext ?? null);

      return {
        ...result,
        plan: displayed?.plan ?? mergedPlan,
      };
    } catch (generateError) {
      setError(getPlanningErrorMessage(generateError));
      return null;
    } finally {
      setGenerating(false);
    }
  }, [user, selectedDate, displayMode]);

  const regeneratePlan = useCallback(async () => {
    return generatePlan();
  }, [generatePlan]);

  const editTimelineBlock = useCallback(
    async ({
      entry,
      edit,
    }: {
      entry: DayTimelineEntry;
      edit: TimelineBlockEditInput;
    }) => {
      if (!user) return null;

      try {
        setSavingEdit(true);
        setError("");
        setLastEditExplanation("");

        const result = await applyTimelineEditAndReplan({
          userId: user.id,
          date: selectedDate,
          entry,
          edit,
        });

        setPlan(result.plan);
        setBaseTimeline(result.timeline);
        setItems(result.items);
        setLastEditExplanation(result.explanation);

        return result;
      } catch (editError) {
        setError(getPlanningErrorMessage(editError));
        return null;
      } finally {
        setSavingEdit(false);
      }
    },
    [user, selectedDate],
  );

  const handleBlockAction = useCallback(
    async ({
      entry,
      action,
      choice,
      rescheduleOption,
      edit,
    }: {
      entry: DayTimelineEntry;
      action: "reschedule" | "no_time" | "complete" | "cancel" | "modify";
      choice?: NoTimeChoice;
      rescheduleOption?: RescheduleOption;
      edit?: TimelineBlockEditInput;
    }) => {
      if (!user) return null;

      try {
        setSavingEdit(true);
        if (action === "complete") {
          setCompletingEntryId(entry.id);
        }
        if (action === "cancel") {
          setCancellingEntryId(entry.id);
        }
        setError("");
        setLastEditExplanation("");

        const result = await applyBlockAction({
          userId: user.id,
          date: selectedDate,
          entry,
          action,
          choice,
          rescheduleOption,
          edit,
        });

        if (result.timeline.length > 0) {
          setBaseTimeline(result.timeline);
        } else {
          await loadPlan();
        }
        setLastEditExplanation(result.explanation);
        if (result.feedback) {
          setRecentAchievement(result.feedback);
          setSportProposalOverrides({});
        }
        return result;
      } catch (actionError) {
        setError(getPlanningErrorMessage(actionError));
        return null;
      } finally {
        setSavingEdit(false);
        setCompletingEntryId(null);
        setCancellingEntryId(null);
      }
    },
    [user, selectedDate, loadPlan],
  );

  return {
    selectedDate,
    setSelectedDate,
    plan,
    timeline,
    items,
    loading,
    generating,
    savingEdit,
    completingEntryId,
    cancellingEntryId,
    sportSaving,
    error,
    lastEditExplanation,
    setLastEditExplanation,
    displayMode,
    canRegenerate: canRegeneratePlan(displayMode),
    lifeContext,
    sportAlternateEntryId,
    loadPlan,
    generatePlan,
    regeneratePlan,
    editTimelineBlock,
    handleBlockAction,
    acceptSportProposalEntry,
    regenerateSportProposal,
    changeSportLevel,
    changeSportType,
    changeSportDuration,
    dismissSportAlternate,
    isWorkoutPlayerOpen,
    activeWorkoutSession,
    activeWorkoutBlockId,
    sportMissingEntry,
    setSportMissingEntry,
    openingWorkout,
    openWorkoutSessionForEntry,
    resolvePersistedWorkoutSession,
    startWorkoutSession,
    generateWorkoutForEntry,
    completeActiveWorkout,
    recentAchievement,
    setRecentAchievement,
  };
}
