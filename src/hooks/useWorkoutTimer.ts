import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { WorkoutTimerStep } from "../lib/workout/workoutSessionSteps";

export type WorkoutTimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

const STORAGE_PREFIX = "equilibre-workout-timer";

type PersistedTimerState = {
  sessionId: string;
  stepIndex: number;
  remainingSeconds: number;
  status: WorkoutTimerStatus;
  updatedAt: string;
};

function loadPersisted(sessionId: string): PersistedTimerState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}:${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimerState;
  } catch {
    return null;
  }
}

function savePersisted(state: PersistedTimerState): void {
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}:${state.sessionId}`,
      JSON.stringify(state),
    );
  } catch {
    // ignore quota errors
  }
}

function clearPersisted(sessionId: string): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}:${sessionId}`);
}

export function useWorkoutTimer({
  sessionId,
  steps,
  soundEnabled = false,
  vibrationEnabled = false,
}: {
  sessionId: string;
  steps: WorkoutTimerStep[];
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}) {
  const persisted = useMemo(() => loadPersisted(sessionId), [sessionId]);
  const [status, setStatus] = useState<WorkoutTimerStatus>(
    persisted?.status === "running" ? "paused" : persisted?.status ?? "idle",
  );
  const [stepIndex, setStepIndex] = useState(persisted?.stepIndex ?? 0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    persisted?.remainingSeconds ??
      steps[0]?.durationSeconds ??
      0,
  );
  const tickRef = useRef<number | null>(null);

  const currentStep = steps[stepIndex] ?? null;
  const nextStep = steps[stepIndex + 1] ?? null;
  const totalSteps = steps.length;

  const persist = useCallback(
    (nextStatus: WorkoutTimerStatus, nextStepIndex: number, nextRemaining: number) => {
      savePersisted({
        sessionId,
        stepIndex: nextStepIndex,
        remainingSeconds: nextRemaining,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    },
    [sessionId],
  );

  const signalStepComplete = useCallback(() => {
    if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(120);
    }
    if (soundEnabled && typeof Audio !== "undefined") {
      try {
        const beep = new Audio(
          "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==",
        );
        void beep.play();
      } catch {
        // ignore autoplay restrictions
      }
    }
  }, [soundEnabled, vibrationEnabled]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        setStatus("completed");
        clearPersisted(sessionId);
        return;
      }
      setStepIndex(index);
      setRemainingSeconds(steps[index].durationSeconds);
      persist(status, index, steps[index].durationSeconds);
    },
    [steps, persist, sessionId, status],
  );

  const advanceStep = useCallback(() => {
    signalStepComplete();
    goToStep(stepIndex + 1);
  }, [goToStep, signalStepComplete, stepIndex]);

  useEffect(() => {
    if (status !== "running") {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    tickRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          advanceStep();
          return 0;
        }
        const next = current - 1;
        persist("running", stepIndex, next);
        return next;
      });
    }, 1000);

    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [status, stepIndex, advanceStep, persist]);

  const start = useCallback(() => {
    if (steps.length === 0) return;
    setStatus("running");
    persist("running", stepIndex, remainingSeconds || steps[stepIndex]?.durationSeconds || 30);
  }, [steps, stepIndex, remainingSeconds, persist]);

  const pause = useCallback(() => {
    setStatus("paused");
    persist("paused", stepIndex, remainingSeconds);
  }, [stepIndex, remainingSeconds, persist]);

  const resume = useCallback(() => {
    setStatus("running");
    persist("running", stepIndex, remainingSeconds);
  }, [stepIndex, remainingSeconds, persist]);

  const skip = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  const previous = useCallback(() => {
    if (stepIndex === 0) return;
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const stop = useCallback(() => {
    setStatus("cancelled");
    clearPersisted(sessionId);
  }, [sessionId]);

  const complete = useCallback(() => {
    setStatus("completed");
    clearPersisted(sessionId);
  }, [sessionId]);

  const reset = useCallback(() => {
    setStatus("idle");
    setStepIndex(0);
    setRemainingSeconds(steps[0]?.durationSeconds ?? 0);
    clearPersisted(sessionId);
  }, [sessionId, steps]);

  return {
    status,
    stepIndex,
    remainingSeconds,
    currentStep,
    nextStep,
    totalSteps,
    start,
    pause,
    resume,
    skip,
    previous,
    stop,
    complete,
    reset,
  };
}
