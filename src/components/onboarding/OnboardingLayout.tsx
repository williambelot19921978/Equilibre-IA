import type { ReactNode } from "react";

import { BrandName } from "../aura/BrandName";
import { ProgressStepper } from "../ui/ProgressStepper";
import { ONBOARDING_FLOW_STEPS, resolveOnboardingStepIndex } from "../../lib/onboarding/onboardingProgressStore";

type OnboardingLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  stepRoute?: string;
  showProgress?: boolean;
  footer?: ReactNode;
};

export function OnboardingLayout({
  children,
  title,
  subtitle,
  stepRoute,
  showProgress = true,
  footer,
}: OnboardingLayoutProps) {
  const stepIndex = stepRoute ? resolveOnboardingStepIndex(stepRoute) : 0;

  return (
    <main className="onboarding-page">
      <section className="onboarding-card ds-animate-in">
        <header className="onboarding-header">
          <BrandName />
          {showProgress && stepIndex > 0 && (
            <ProgressStepper
              currentStep={stepIndex}
              totalSteps={ONBOARDING_FLOW_STEPS.length}
              labels={[...ONBOARDING_FLOW_STEPS]}
            />
          )}
          <h1>{title}</h1>
          {subtitle && <p className="onboarding-subtitle">{subtitle}</p>}
        </header>

        <div className="onboarding-body">{children}</div>

        {footer && <footer className="onboarding-footer">{footer}</footer>}
      </section>
    </main>
  );
}
