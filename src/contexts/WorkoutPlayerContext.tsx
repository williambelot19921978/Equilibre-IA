import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useAuth } from "../hooks/useAuth";
import { useUrlDate } from "../hooks/useUrlDate";
import { SportSessionMissingSheet } from "../components/planning/SportSessionMissingSheet";
import {
  WorkoutSessionPlayer,
  type WorkoutCompletionOutcome,
} from "../components/planning/WorkoutSessionPlayer";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import {
  openWorkoutSessionForBlock,
  type WorkoutOpenContext,
} from "../lib/workout/openWorkoutSessionForBlock";
import {
  clearPersistedWorkoutPlayer,
  loadPersistedWorkoutPlayer,
  savePersistedWorkoutPlayer,
} from "../lib/workout/workoutPlayerPersistence";
import { finishWorkoutSession } from "../services/workoutSessionService";
import { loadDailyCheckin } from "../services/dailyCheckinService";
import type { WorkoutSession } from "../types/workoutSession";

type WorkoutEntryHelpers = {
  generateForEntry?: (entry: DayTimelineEntry) => Promise<void>;
  regenerateForEntry?: (entry: DayTimelineEntry) => Promise<void>;
  resolveWorkoutOpenContext?: () => WorkoutOpenContext;
  onAfterComplete?: (
    outcome: WorkoutCompletionOutcome,
    result?: { explanation: string; freedMinutes: number } | null,
  ) => void | Promise<void>;
  onAchievement?: (feedback: import("../types/achievementFeedback").AchievementFeedback) => void;
};

type WorkoutPlayerContextValue = {
  isWorkoutPlayerOpen: boolean;
  activeWorkoutBlockId: string | null;
  activeWorkoutSession: WorkoutSession | null;
  sportMissingEntry: DayTimelineEntry | null;
  openingWorkout: boolean;
  workoutFeedback: string | null;
  handleStartWorkout: (
    entry: DayTimelineEntry,
    persistedSession?: WorkoutSession | null,
  ) => void;
  openPlayer: (entry: DayTimelineEntry, session: WorkoutSession) => void;
  closePlayer: () => void;
  clearWorkoutFeedback: () => void;
  setSportMissingEntry: (entry: DayTimelineEntry | null) => void;
  setWorkoutEntryHelpers: (helpers: WorkoutEntryHelpers) => void;
  completeActiveWorkout: (
    outcome: WorkoutCompletionOutcome,
    onAfterComplete?: () => void | Promise<void>,
  ) => Promise<void>;
};

const WorkoutPlayerContext = createContext<WorkoutPlayerContextValue | null>(
  null,
);

export function WorkoutPlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { selectedDate } = useUrlDate();
  const [activeWorkoutEntry, setActiveWorkoutEntry] =
    useState<DayTimelineEntry | null>(null);
  const [activeWorkoutSession, setActiveWorkoutSession] =
    useState<WorkoutSession | null>(null);
  const [isWorkoutPlayerOpen, setIsWorkoutPlayerOpen] = useState(false);
  const [sportMissingEntry, setSportMissingEntry] =
    useState<DayTimelineEntry | null>(null);
  const [openingWorkout, setOpeningWorkout] = useState(false);
  const [workoutFeedback, setWorkoutFeedback] = useState<string | null>(null);
  const [sportSaving, setSportSaving] = useState(false);
  const [entryHelpers, setEntryHelpers] = useState<WorkoutEntryHelpers>({});
  const [workoutStartedAt, setWorkoutStartedAt] = useState<string | null>(null);
  const restoredForUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      restoredForUserIdRef.current = null;
      setIsWorkoutPlayerOpen(false);
      setActiveWorkoutEntry(null);
      setActiveWorkoutSession(null);
      setWorkoutStartedAt(null);
      return;
    }

    if (restoredForUserIdRef.current === user.id) {
      return;
    }

    restoredForUserIdRef.current = user.id;

    const persisted = loadPersistedWorkoutPlayer(user.id);
    if (!persisted) {
      setIsWorkoutPlayerOpen(false);
      setActiveWorkoutEntry(null);
      setActiveWorkoutSession(null);
      setWorkoutStartedAt(null);
      return;
    }

    setActiveWorkoutEntry(persisted.entry);
    setActiveWorkoutSession(persisted.session);
    setWorkoutStartedAt(persisted.startedAt);
    setIsWorkoutPlayerOpen(true);
  }, [user?.id]);

  const persistActiveWorkout = useCallback(
    (
      entry: DayTimelineEntry,
      session: WorkoutSession,
      startedAt: string,
      isOpen: boolean,
    ) => {
      if (!user?.id) return;

      if (!isOpen) {
        clearPersistedWorkoutPlayer();
        return;
      }

      savePersistedWorkoutPlayer({
        userId: user.id,
        selectedDate,
        entry,
        session,
        startedAt,
        isOpen: true,
      });
    },
    [user?.id, selectedDate],
  );

  const clearWorkoutFeedback = useCallback(() => {
    setWorkoutFeedback(null);
  }, []);

  const setWorkoutEntryHelpers = useCallback((helpers: WorkoutEntryHelpers) => {
    setEntryHelpers(helpers);
  }, []);

  const openPlayer = useCallback(
    (entry: DayTimelineEntry, session: WorkoutSession) => {
      const startedAt = new Date().toISOString();
      setActiveWorkoutEntry(entry);
      setActiveWorkoutSession(session);
      setWorkoutStartedAt(startedAt);
      setIsWorkoutPlayerOpen(true);
      setSportMissingEntry(null);
      setWorkoutFeedback(null);
      persistActiveWorkout(entry, session, startedAt, true);
    },
    [persistActiveWorkout],
  );

  const closePlayer = useCallback(() => {
    setIsWorkoutPlayerOpen(false);
    setActiveWorkoutEntry(null);
    setActiveWorkoutSession(null);
    setWorkoutStartedAt(null);
    clearPersistedWorkoutPlayer();
  }, []);

  const handleStartWorkout = useCallback(
    (entry: DayTimelineEntry, persistedSession?: WorkoutSession | null) => {
      setOpeningWorkout(true);
      setWorkoutFeedback(null);

      try {
        const context = entryHelpers.resolveWorkoutOpenContext?.();
        const outcome = openWorkoutSessionForBlock(
          entry,
          persistedSession ?? null,
          context,
        );

        switch (outcome.status) {
          case "opened":
            openPlayer(entry, outcome.session);
            break;
          case "blocked":
            setWorkoutFeedback(outcome.availability.message);
            break;
          case "needs_session":
            setSportMissingEntry(entry);
            setWorkoutFeedback(
              "Aucune séance n'est encore associée à cette activité sportive.",
            );
            break;
          case "invalid_session":
            setSportMissingEntry(entry);
            setWorkoutFeedback(
              `${outcome.message} Tu peux en générer une nouvelle.`,
            );
            break;
          case "not_sport":
            setWorkoutFeedback(
              `Je n'ai pas pu ouvrir cette séance : ${outcome.message}`,
            );
            break;
        }
      } finally {
        setOpeningWorkout(false);
      }
    },
    [openPlayer, entryHelpers],
  );

  const completeActiveWorkout = useCallback(
    async (
      outcome: WorkoutCompletionOutcome,
      onAfterComplete?: () => void | Promise<void>,
    ) => {
      if (!user || !activeWorkoutEntry || !activeWorkoutSession) return;

      try {
        setSportSaving(true);
        const dailyCheckin = await loadDailyCheckin({
          userId: user.id,
          date: selectedDate,
        }).catch(() => null);
        const result = await finishWorkoutSession({
          userId: user.id,
          date: selectedDate,
          entry: activeWorkoutEntry,
          session: activeWorkoutSession,
          outcome,
          dailyCheckin,
          actualStartedAt: workoutStartedAt ?? undefined,
        });
        closePlayer();
        if (result?.feedback) {
          entryHelpers.onAchievement?.(result.feedback);
        }
        if (onAfterComplete) {
          await onAfterComplete();
        } else {
          await entryHelpers.onAfterComplete?.(outcome, result);
        }
      } catch (completeError) {
        setWorkoutFeedback(
          completeError instanceof Error
            ? `Je n'ai pas pu enregistrer la séance : ${completeError.message}`
            : "Je n'ai pas pu enregistrer la séance.",
        );
      } finally {
        setSportSaving(false);
      }
    },
    [user, selectedDate, activeWorkoutEntry, activeWorkoutSession, workoutStartedAt, closePlayer, entryHelpers],
  );

  const handleWorkoutTimerStart = useCallback(() => {
    if (!activeWorkoutEntry || !activeWorkoutSession) return;

    const startedAt = workoutStartedAt ?? new Date().toISOString();
    if (!workoutStartedAt) {
      setWorkoutStartedAt(startedAt);
    }
    persistActiveWorkout(activeWorkoutEntry, activeWorkoutSession, startedAt, true);
  }, [
    activeWorkoutEntry,
    activeWorkoutSession,
    workoutStartedAt,
    persistActiveWorkout,
  ]);

  const value = useMemo<WorkoutPlayerContextValue>(
    () => ({
      isWorkoutPlayerOpen,
      activeWorkoutBlockId: activeWorkoutEntry?.id ?? null,
      activeWorkoutSession,
      sportMissingEntry,
      openingWorkout,
      workoutFeedback,
      handleStartWorkout,
      openPlayer,
      closePlayer,
      clearWorkoutFeedback,
      setSportMissingEntry,
      setWorkoutEntryHelpers,
      completeActiveWorkout,
    }),
    [
      isWorkoutPlayerOpen,
      activeWorkoutEntry,
      activeWorkoutSession,
      sportMissingEntry,
      openingWorkout,
      workoutFeedback,
      handleStartWorkout,
      openPlayer,
      closePlayer,
      clearWorkoutFeedback,
      setWorkoutEntryHelpers,
      completeActiveWorkout,
    ],
  );

  const portalTarget =
    typeof document === "undefined" ? null : document.body;

  return (
    <WorkoutPlayerContext.Provider value={value}>
      {children}

      {workoutFeedback && portalTarget
        ? createPortal(
            <div className="workout-feedback-banner" role="alert">
              <p>{workoutFeedback}</p>
              <button type="button" onClick={clearWorkoutFeedback}>
                Fermer
              </button>
            </div>,
            portalTarget,
          )
        : null}

      {isWorkoutPlayerOpen && activeWorkoutSession && portalTarget
        ? createPortal(
            <WorkoutSessionPlayer
              session={activeWorkoutSession}
              onClose={closePlayer}
              onComplete={(outcome) => void completeActiveWorkout(outcome)}
              onTimerStart={handleWorkoutTimerStart}
            />,
            portalTarget,
          )
        : null}

      {sportMissingEntry && portalTarget
        ? createPortal(
            <SportSessionMissingSheet
              title={sportMissingEntry.title}
              message="Aucune séance n'est encore associée à cette activité sportive."
              loading={sportSaving || openingWorkout}
              onGenerate={() => {
                if (entryHelpers.generateForEntry) {
                  void entryHelpers
                    .generateForEntry(sportMissingEntry)
                    .finally(() => setSportMissingEntry(null));
                  return;
                }
                setWorkoutFeedback(
                  "Je n'ai pas pu générer la séance — réessaie depuis le planning.",
                );
              }}
              onChooseAnother={() => {
                if (entryHelpers.regenerateForEntry) {
                  void entryHelpers
                    .regenerateForEntry(sportMissingEntry)
                    .finally(() => setSportMissingEntry(null));
                  return;
                }
                setWorkoutFeedback(
                  "Je n'ai pas pu proposer une autre séance — réessaie depuis le planning.",
                );
              }}
              onClose={() => setSportMissingEntry(null)}
            />,
            portalTarget,
          )
        : null}
    </WorkoutPlayerContext.Provider>
  );
}

export function useWorkoutPlayer(): WorkoutPlayerContextValue {
  const context = useContext(WorkoutPlayerContext);
  if (!context) {
    throw new Error("useWorkoutPlayer must be used within WorkoutPlayerProvider");
  }
  return context;
}

export function useWorkoutPlayerOptional(): WorkoutPlayerContextValue | null {
  return useContext(WorkoutPlayerContext);
}
