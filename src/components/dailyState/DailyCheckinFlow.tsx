import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  buildCheckinFlow,
  defaultDailyStateEngine,
  dailyStateToCheckinInput,
  getCheckinMode,
  MOOD_OPTIONS,
  SPECIAL_DAY_OPTIONS,
  type CheckinFlowStep,
  type DailyStateMood,
  type SpecialDayKind,
} from "../../dailyStateEngine";
import { saveDailyCheckin } from "../../services/dailyCheckinService";
import { Button } from "../ui/Button";
import { ProgressStepper } from "../ui/ProgressStepper";
import { useAuth } from "../../hooks/useAuth";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";
import { AppRoutes } from "../../lib/navigation/routes";
import { isDailyStateEngineEnabled } from "../../config/featureFlags";

type FlowData = {
  mood?: DailyStateMood;
  energy: number;
  stress: number;
  sleepQuality: number;
  specialDay: SpecialDayKind;
  notes: string;
  adaptiveAnswer?: boolean;
};

export function DailyCheckinFlow({ onComplete }: { readonly onComplete?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const date = getCurrentDeviceDate();

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FlowData>({
    energy: 6,
    stress: 4,
    sleepQuality: 4,
    specialDay: "normal",
    notes: "",
  });

  const checkinMode = user?.id ? getCheckinMode(user.id) : "standard";

  const flow = useMemo(
    () =>
      user?.id
        ? buildCheckinFlow({ userId: user.id, mode: checkinMode, energy: data.energy })
        : null,
    [user?.id, checkinMode, data.energy],
  );

  const steps = useMemo(() => {
    const base = flow?.steps ?? (["mood", "energy"] as CheckinFlowStep[]);
    return flow?.adaptiveStep ? [...base, flow.adaptiveStep] : base;
  }, [flow]);

  const currentStep = steps[stepIndex];

  async function finishCheckin() {
    if (!user?.id || !data.mood) return;
    setSaving(true);
    try {
      const state = defaultDailyStateEngine.submitCheckin({
        userId: user.id,
        date,
        mood: data.mood,
        energy: data.energy,
        stress: data.stress,
        sleepQuality: data.sleepQuality,
        specialDay: data.specialDay,
        notes: data.notes || undefined,
        adaptiveAnswer: data.adaptiveAnswer,
      });

      await saveDailyCheckin({
        userId: user.id,
        date,
        input: dailyStateToCheckinInput(state),
      }).catch(() => undefined);

      onComplete?.();
      navigate(AppRoutes.HOME, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    if (!user?.id) return;
    defaultDailyStateEngine.skipCheckin(user.id, date);
    navigate(AppRoutes.HOME, { replace: true });
  }

  function nextStep() {
    if (stepIndex >= steps.length - 1) {
      void finishCheckin();
      return;
    }
    setStepIndex((value) => value + 1);
  }

  if (!isDailyStateEngineEnabled()) {
    return <p>Check-in quotidien désactivé.</p>;
  }

  return (
    <div className="daily-checkin-flow" data-testid="daily-checkin-flow">
      <ProgressStepper currentStep={stepIndex + 1} totalSteps={steps.length} />

      <p className="daily-checkin-estimate">
        ~{flow?.estimatedSeconds ?? 30} secondes — pas un questionnaire, juste votre ressenti.
      </p>

      <div key={currentStep} className="daily-checkin-step ds-animate-in">
        {currentStep === "mood" && (
          <section>
            <h2>Comment vous sentez-vous aujourd&apos;hui ?</h2>
            <div className="daily-checkin-mood-grid">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`daily-checkin-mood-btn${data.mood === option.value ? " selected" : ""}`}
                  onClick={() => setData((prev) => ({ ...prev, mood: option.value }))}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === "energy" && (
          <section>
            <h2>Votre énergie</h2>
            <input
              className="daily-checkin-range"
              type="range"
              min={1}
              max={10}
              value={data.energy}
              aria-label="Niveau d'énergie"
              onChange={(event) => setData((prev) => ({ ...prev, energy: Number(event.target.value) }))}
            />
            <p>{data.energy}/10</p>
          </section>
        )}

        {currentStep === "stress" && (
          <section>
            <h2>Votre stress</h2>
            <input
              className="daily-checkin-range"
              type="range"
              min={1}
              max={10}
              value={data.stress}
              aria-label="Niveau de stress"
              onChange={(event) => setData((prev) => ({ ...prev, stress: Number(event.target.value) }))}
            />
            <p>{data.stress}/10</p>
          </section>
        )}

        {currentStep === "sleep" && (
          <section>
            <h2>Comment avez-vous dormi ?</h2>
            <div className="daily-checkin-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="daily-checkin-star-btn"
                  aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                  onClick={() => setData((prev) => ({ ...prev, sleepQuality: star }))}
                >
                  {star <= data.sleepQuality ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === "specialDay" && (
          <section>
            <h2>Aujourd&apos;hui est une journée…</h2>
            <select
              className="ds-select ds-select-full"
              value={data.specialDay}
              onChange={(event) =>
                setData((prev) => ({ ...prev, specialDay: event.target.value as SpecialDayKind }))
              }
            >
              {SPECIAL_DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>
        )}

        {currentStep === "notes" && (
          <section>
            <h2>Note (optionnel)</h2>
            <textarea
              className="ds-textarea ds-textarea-full"
              value={data.notes}
              onChange={(event) => setData((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
            />
          </section>
        )}

        {currentStep === "adaptive_sleep" && (
          <section>
            <h2>Avez-vous mal dormi ?</h2>
            <div className="daily-checkin-binary">
              <Button type="button" variant="secondary" onClick={() => setData((prev) => ({ ...prev, adaptiveAnswer: true }))}>
                Oui
              </Button>
              <Button type="button" variant="secondary" onClick={() => setData((prev) => ({ ...prev, adaptiveAnswer: false }))}>
                Non
              </Button>
            </div>
          </section>
        )}
      </div>

      <div className="daily-checkin-actions">
        <Button type="button" variant="ghost" onClick={handleSkip} data-testid="daily-checkin-skip">
          Passer pour aujourd&apos;hui
        </Button>
        <Button
          type="button"
          loading={saving}
          disabled={currentStep === "mood" && !data.mood}
          onClick={nextStep}
        >
          {stepIndex >= steps.length - 1 ? "Terminer" : "Suivant"}
        </Button>
      </div>
    </div>
  );
}
