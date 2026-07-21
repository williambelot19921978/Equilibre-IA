import { Button } from "../../components/ui/Button";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { useAuth } from "../../hooks/useAuth";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { patchOnboardingUxProgress } from "../../lib/onboarding/onboardingProgressStore";
import {
  setDailyCheckinPreference,
} from "../../lib/preferences/dailyCheckinPreference";
import { setCheckinMode } from "../../dailyStateEngine";
import { AppRoutes } from "../../lib/navigation/routes";

export function OnboardingCheckinPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();

  function markDone() {
    if (user?.id) {
      patchOnboardingUxProgress(user.id, { checkinChoiceDone: true });
    }
  }

  function handleEnable() {
    if (user?.id) {
      setDailyCheckinPreference(user.id, { enabled: true });
      setCheckinMode(user.id, "standard");
    }
    markDone();
    void goToResolvedRoute();
  }

  function handleLater() {
    if (user?.id) {
      setDailyCheckinPreference(user.id, { enabled: false });
    }
    markDone();
    void goToResolvedRoute();
  }

  return (
    <OnboardingLayout
      title="Check-in quotidien"
      subtitle="Optionnel — tu pourras modifier ce choix à tout moment dans les paramètres."
      stepRoute={AppRoutes.ONBOARDING_CHECKIN}
    >
      <div className="onboarding-info-box">
        <p>
          En activant le check-in quotidien, l&apos;IA pourra mieux comprendre votre état
          et personnaliser ses recommandations.
        </p>
        <p className="onboarding-muted">Moins de 30 secondes par jour · toujours skippable</p>
      </div>

      <div className="onboarding-actions-stack">
        <Button fullWidth onClick={handleEnable} data-testid="onboarding-checkin-enable">
          ✅ Activer (recommandé)
        </Button>
        <Button fullWidth variant="secondary" onClick={handleLater} data-testid="onboarding-checkin-later">
          ⏩ Plus tard
        </Button>
      </div>
    </OnboardingLayout>
  );
}
