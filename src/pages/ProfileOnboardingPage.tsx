import { useState, type FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { FormField, Input } from "../components/ui/FormField";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { patchOnboardingUxProgress } from "../lib/onboarding/onboardingProgressStore";
import { saveBaseProfileFacts } from "../services/profileService";
import { AppRoutes } from "../lib/navigation/routes";

export function ProfileOnboardingPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();

  const [partnerName, setPartnerName] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [bedTime, setBedTime] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Utilisateur non connecté.");
      return;
    }

    setErrorMessage("");

    try {
      setSaving(true);

      await saveBaseProfileFacts({
        userId: user.id,
        partnerName,
        workStart,
        workEnd,
        wakeTime,
        bedTime,
        mainPriority: "",
      });

      patchOnboardingUxProgress(user.id, { profileBasicsDone: true });
      await goToResolvedRoute();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingLayout
      title="Votre profil"
      subtitle="Quelques repères pour personnaliser votre journée type."
      stepRoute={AppRoutes.PROFILE}
    >
      <form onSubmit={handleSubmit} className="onboarding-form">
        <FormField label="Prénom du conjoint (facultatif)" htmlFor="partner-name">
          <Input
            id="partner-name"
            type="text"
            value={partnerName}
            onChange={(event) => setPartnerName(event.target.value)}
          />
        </FormField>

        <FormField label="Heure habituelle de début de travail" htmlFor="work-start">
          <Input
            id="work-start"
            type="time"
            value={workStart}
            onChange={(event) => setWorkStart(event.target.value)}
          />
        </FormField>

        <FormField label="Heure habituelle de fin de travail" htmlFor="work-end">
          <Input
            id="work-end"
            type="time"
            value={workEnd}
            onChange={(event) => setWorkEnd(event.target.value)}
          />
        </FormField>

        <FormField label="Heure habituelle de réveil" htmlFor="wake-time">
          <Input
            id="wake-time"
            type="time"
            value={wakeTime}
            onChange={(event) => setWakeTime(event.target.value)}
          />
        </FormField>

        <FormField label="Heure idéale de coucher" htmlFor="bed-time">
          <Input
            id="bed-time"
            type="time"
            value={bedTime}
            onChange={(event) => setBedTime(event.target.value)}
          />
        </FormField>

        {errorMessage && <ErrorState kind="error" title={errorMessage} />}

        <Button type="submit" fullWidth loading={saving} data-testid="onboarding-profile-submit">
          Enregistrer mon profil
        </Button>
      </form>
    </OnboardingLayout>
  );
}
