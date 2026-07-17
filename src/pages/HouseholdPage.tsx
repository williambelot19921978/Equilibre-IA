import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { createHouseholdForCurrentUser } from "../services/householdService";

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
      setErrorMessage("Donne un nom à ton foyer.");
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage("Indique ton prénom.");
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
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Créer le foyer</h1>

        <p className="auth-intro">
          Cet espace regroupera les adultes, les enfants et les contraintes
          familiales.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Nom du foyer</span>
            <input
              type="text"
              value={householdName}
              onChange={(event) => setHouseholdName(event.target.value)}
              placeholder="Ex. Famille Belot"
              required
            />
          </label>

          <label>
            <span>Ton prénom dans le foyer</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer le foyer"}
          </button>
        </form>
      </section>
    </main>
  );
}
