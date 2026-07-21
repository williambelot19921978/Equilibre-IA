type ProgressStepperProps = {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
};

export function ProgressStepper({
  currentStep,
  totalSteps,
  labels,
  className = "",
}: ProgressStepperProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div
      className={`ds-progress-stepper${className ? ` ${className}` : ""}`}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Étape ${currentStep} sur ${totalSteps}`}
    >
      <div className="ds-progress-stepper-track">
        <div
          className="ds-progress-stepper-fill ds-animate-in"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="ds-progress-stepper-label">
        Étape {currentStep} / {totalSteps}
        {labels?.[currentStep - 1] ? ` — ${labels[currentStep - 1]}` : ""}
      </p>
    </div>
  );
}
