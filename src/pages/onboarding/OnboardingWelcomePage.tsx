import { Button } from "../../components/ui/Button";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { AppRoutes } from "../../lib/navigation/routes";

export function OnboardingWelcomePage() {
  const { advanceOnboardingStep } = useAppNavigation();

  function handleContinue() {
    void advanceOnboardingStep(
      { welcomeSeen: true },
      AppRoutes.ONBOARDING_INTRO,
    );
  }

  return (
    <OnboardingLayout
      title="Bienvenue"
      subtitle="Aura t'aide à organiser ton quotidien avec clarté et sérénité."
      showProgress={false}
    >
      <div className="onboarding-hero">
        <span className="onboarding-hero-icon" aria-hidden="true">
          🌿
        </span>
        <p>
          En quelques minutes, configure ton espace personnel.
          Tu gardes le contrôle à chaque étape.
        </p>
      </div>
      <Button fullWidth onClick={handleContinue} data-testid="onboarding-welcome-continue">
        Commencer
      </Button>
    </OnboardingLayout>
  );
}
