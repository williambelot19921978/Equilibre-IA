import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { addChild, getChildrenByHousehold } from "../services/childrenService";
import { getHouseholdMembership } from "../services/householdService";
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
          setErrorMessage("Aucun foyer n’a été trouvé.");
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
      setErrorMessage("Le foyer n’est pas encore disponible.");
      return;
    }

    if (!firstName.trim()) {
      setErrorMessage("Indique le prénom de l’enfant.");
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
          : "Impossible d’ajouter l’enfant.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    setErrorMessage("");

    try {
      await goToResolvedRoute();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de terminer la configuration.",
      );
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>Chargement du foyer...</p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Les enfants du foyer</h1>

        <p className="auth-intro">
          Ajoute les enfants pour que l’application puisse mieux comprendre
          l’organisation familiale.
        </p>

        <form onSubmit={handleAddChild} className="auth-form">
          <label>
            <span>Prénom de l’enfant</span>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Date de naissance, facultative</span>
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </label>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Ajout..." : "Ajouter l’enfant"}
          </button>
        </form>

        {children.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2>Enfants ajoutés</h2>

            <ul>
              {children.map((child) => (
                <li key={child.id}>
                  {child.first_name}
                  {child.birth_date
                    ? ` — ${new Date(child.birth_date).toLocaleDateString(
                        "fr-FR",
                      )}`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="button" onClick={handleFinish}>
          Terminer la configuration
        </button>
      </section>
    </main>
  );
}
