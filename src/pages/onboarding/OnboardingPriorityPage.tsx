import { useState, type FormEvent } from "react";

import { Button } from "../../components/ui/Button";
import { FormField, Select } from "../../components/ui/FormField";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { useAuth } from "../../hooks/useAuth";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { saveMainPriorityFact } from "../../services/profileService";
import { AppRoutes } from "../../lib/navigation/routes";
import { ErrorState } from "../../components/ui/ErrorState";

const PRIORITY_OPTIONS = [
  { value: "family", label: "Famille" },
  { value: "study", label: "Études ou formation" },
  { value: "sleep", label: "Sommeil" },
  { value: "sport", label: "Sport" },
  { value: "personal_time", label: "Temps personnel" },
  { value: "work", label: "Travail" },
];

export function OnboardingPriorityPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();
  const [mainPriority, setMainPriority] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    if (!mainPriority) {
      setErrorMessage("Choisissez une priorité pour continuer.");
      return;
    }

    setErrorMessage("");
    setSaving(true);
    try {
      await saveMainPriorityFact(user.id, mainPriority);
      await goToResolvedRoute();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d'enregistrer la priorité.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingLayout
      title="Priorité actuelle"
      subtitle="Qu'est-ce qui compte le plus pour toi en ce moment ?"
      stepRoute={AppRoutes.ONBOARDING_PRIORITY}
    >
      <form onSubmit={handleSubmit} className="onboarding-form">
        <FormField label="Priorité principale" required htmlFor="main-priority">
          <Select
            id="main-priority"
            value={mainPriority}
            onChange={(event) => setMainPriority(event.target.value)}
            required
          >
            <option value="">Choisir</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        {errorMessage && <ErrorState kind="error" title={errorMessage} />}

        <Button type="submit" fullWidth loading={saving}>
          Continuer
        </Button>
      </form>
    </OnboardingLayout>
  );
}
