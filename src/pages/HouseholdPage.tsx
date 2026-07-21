import { useState, type FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { FormField, Input } from "../components/ui/FormField";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { createHouseholdForCurrentUser } from "../services/householdService";
import { AppRoutes } from "../lib/navigation/routes";

export function HouseholdPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();

  const [householdName, setHouseholdName] = useState("");
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.first_name ?? "",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!householdName.trim()) {
      setErrorMessage("Donnez un nom à votre foyer.");
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage("Indiquez votre prénom.");
      return;
    }

    try {
      setLoading(true);

      await createHouseholdForCurrentUser({
        householdName: householdName.trim(),
        displayName: displayName.trim(),
      });

      await goToResolvedRoute();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer le foyer.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout
      title="Créer le foyer"
      subtitle="Cet espace regroupera les adultes, les enfants et les contraintes familiales."
      stepRoute={AppRoutes.HOUSEHOLD}
    >
      <form onSubmit={handleSubmit} className="onboarding-form">
        <FormField label="Nom du foyer" required htmlFor="household-name">
          <Input
            id="household-name"
            type="text"
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
            placeholder="Ex. Famille Belot"
            required
          />
        </FormField>

        <FormField label="Votre prénom dans le foyer" required htmlFor="display-name">
          <Input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </FormField>

        {errorMessage && <ErrorState kind="error" title={errorMessage} />}

        <Button type="submit" fullWidth loading={loading} data-testid="onboarding-household-submit">
          Créer le foyer
        </Button>
      </form>
    </OnboardingLayout>
  );
}
