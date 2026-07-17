import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { RelaxationGuide } from "../../types/spiritual";
import { Button } from "../ui/Button";

type RelaxationPlayerModalProps = {
  guide: RelaxationGuide;
  onClose: () => void;
  onFinish?: () => void;
};

export function RelaxationPlayerModal({
  guide,
  onClose,
  onFinish,
}: RelaxationPlayerModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(guide.durationMinutes * 60);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
      setRunning(false);
    }
  }, [running, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-card spiritual-relaxation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relaxation-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="relaxation-title">{guide.title}</h2>
        <p className="planning-hint">
          Durée suggérée : {guide.durationMinutes} min
        </p>

        <p className="spiritual-relaxation-timer" aria-live="polite">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>

        <ol className="spiritual-steps">
          {guide.steps.map((step, index) => (
            <li
              key={step}
              className={
                index === stepIndex ? "spiritual-step-active" : undefined
              }
            >
              {step}
            </li>
          ))}
        </ol>

        <div className="spiritual-modal-actions">
          {!running ? (
            <Button
              type="button"
              onClick={() => {
                setRunning(true);
                if (stepIndex < guide.steps.length - 1) {
                  setStepIndex((value) => value + 1);
                }
              }}
            >
              Démarrer
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setRunning(false)}>
              Pause
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setStepIndex((value) =>
                Math.min(value + 1, guide.steps.length - 1),
              )
            }
            disabled={stepIndex >= guide.steps.length - 1}
          >
            Étape suivante
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onFinish?.();
              onClose();
            }}
          >
            Terminer
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
