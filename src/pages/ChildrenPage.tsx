import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { FormField, Input } from "../components/ui/FormField";
import { SkeletonCard } from "../components/ui/Skeleton";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { patchOnboardingUxProgress } from "../lib/onboarding/onboardingProgressStore";
import { addChild, getChildrenByHousehold } from "../services/childrenService";
import { getHouseholdMembership } from "../services/householdService";
import { AppRoutes } from "../lib/navigation/routes";
import type { ChildRecord } from "../types";

export function ChildrenPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadHousehold() {
      if (!user) return;

      try {
        const membership = await getHouseholdMembership(user.id);

        if (!membership) {
          setErrorMessage("Aucun foyer n'a été trouvé.");
          setLoading(false);
          return;
        }

        setHouseholdId(membership.household_id);

        const childrenData = await getChildrenByHousehold(
          membership.household_id,
        );
        setChildren(childrenData);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger le foyer.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHousehold();
  }, [user]);

  async function handleAddChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!householdId) {
      setErrorMessage("Le foyer n'est pas encore disponible.");
      return;
    }

    if (!firstName.trim()) {
      setErrorMessage("Indiquez le prénom de l'enfant.");
      return;
    }

    try {
      setSaving(true);

      const child = await addChild({
        householdId,
        firstName: firstName.trim(),
        birthDate: birthDate || null,
      });

      setChildren((current) => [...current, child]);
      setFirstName("");
      setBirthDate("");
      setSuccessMessage("Enfant ajouté.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter l'enfant.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function finishStep() {
    if (user?.id) {
      patchOnboardingUxProgress(user.id, { childrenStepDone: true });
    }
    await goToResolvedRoute();
  }

  if (loading) {
    return (
      <OnboardingLayout title="Les enfants du foyer" showProgress={false}>
        <SkeletonCard />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      title="Les enfants du foyer"
      subtitle="Facultatif — ajoutez les enfants pour affiner l'organisation familiale."
      stepRoute={AppRoutes.CHILDREN}
    >
      <form onSubmit={handleAddChild} className="onboarding-form">
        <FormField label="Prénom de l'enfant" htmlFor="child-first-name">
          <Input
            id="child-first-name"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </FormField>

        <FormField label="Date de naissance (facultatif)" htmlFor="child-birth-date">
          <Input
            id="child-birth-date"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </FormField>

        {errorMessage && <ErrorState kind="error" title={errorMessage} />}
        {successMessage && (
          <p className="onboarding-success" role="status">
            {successMessage}
          </p>
        )}

        <Button type="submit" fullWidth loading={saving}>
          Ajouter l&apos;enfant
        </Button>
      </form>

      {children.length > 0 && (
        <ul className="onboarding-list">
          {children.map((child) => (
            <li key={child.id}>
              <Card variant="ghost">
                {child.first_name}
                {child.birth_date
                  ? ` — ${new Date(child.birth_date).toLocaleDateString("fr-FR")}`
                  : ""}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="onboarding-actions-stack">
        <Button fullWidth onClick={() => void finishStep()} data-testid="onboarding-children-finish">
          {children.length > 0 ? "Continuer" : "Je n'ai pas d'enfant — continuer"}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
