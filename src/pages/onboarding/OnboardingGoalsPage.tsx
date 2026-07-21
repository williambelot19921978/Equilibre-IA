import { useState } from "react";

import { Button } from "../../components/ui/Button";
import { FormField, Input } from "../../components/ui/FormField";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { useAuth } from "../../hooks/useAuth";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { patchOnboardingUxProgress } from "../../lib/onboarding/onboardingProgressStore";
import { createUserGoal } from "../../services/goalsService";
import { isGoalsEnabled } from "../../config/featureFlags";
import { AppRoutes } from "../../lib/navigation/routes";

export function OnboardingGoalsPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  function markDone() {
    if (user?.id) {
      patchOnboardingUxProgress(user.id, { goalsStepDone: true });
    }
  }

  async function handleCreate() {
    if (!user?.id || !title.trim()) return;
    setSaving(true);
    try {
      if (isGoalsEnabled()) {
        createUserGoal(user.id, {
          name: title.trim(),
          category: "personal",
          importance: "medium",
        });
      }
    } finally {
      markDone();
      setSaving(false);
      await goToResolvedRoute();
    }
  }

  function handleSkip() {
    markDone();
    void goToResolvedRoute();
  }

  return (
    <OnboardingLayout
      title="Premier objectif"
      subtitle="Optionnel — tu pourras en ajouter d'autres plus tard."
      stepRoute={AppRoutes.ONBOARDING_GOALS}
    >
      {isGoalsEnabled() ? (
        <form
          className="onboarding-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <FormField label="Nom de l'objectif" hint="Ex. Courir 3 fois par semaine" htmlFor="goal-title">
            <Input
              id="goal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Votre objectif"
            />
          </FormField>
          <div className="onboarding-actions-stack">
            <Button type="submit" fullWidth loading={saving} disabled={!title.trim()}>
              Créer l&apos;objectif
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={handleSkip}>
              Passer cette étape
            </Button>
          </div>
        </form>
      ) : (
        <div className="onboarding-actions-stack">
          <p className="onboarding-muted">
            Les objectifs seront disponibles une fois la fonctionnalité activée.
          </p>
          <Button fullWidth onClick={handleSkip}>
            Continuer
          </Button>
        </div>
      )}
    </OnboardingLayout>
  );
}
