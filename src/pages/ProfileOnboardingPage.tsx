import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { saveBaseProfileFacts } from "../services/profileService";

export function ProfileOnboardingPage() {
  const { user } = useAuth();
  const { goToResolvedRoute } = useAppNavigation();

  const [partnerName, setPartnerName] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [bedTime, setBedTime] = useState("");
  const [mainPriority, setMainPriority] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Utilisateur non connecté.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setSaving(true);

      await saveBaseProfileFacts({
        userId: user.id,
        partnerName,
        workStart,
        workEnd,
        wakeTime,
        bedTime,
        mainPriority,
      });

      setSuccessMessage("Profil familial enregistré.");
      setTimeout(() => {
        void goToResolvedRoute();
      }, 700);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Mieux te connaître</h1>

        <p className="auth-intro">
          Ces premières informations permettront de proposer des journées plus
          cohérentes.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Prénom du conjoint, facultatif</span>
            <input
              type="text"
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
            />
          </label>

          <label>
            <span>Heure habituelle de début de travail</span>
            <input
              type="time"
              value={workStart}
              onChange={(event) => setWorkStart(event.target.value)}
            />
          </label>

          <label>
            <span>Heure habituelle de fin de travail</span>
            <input
              type="time"
              value={workEnd}
              onChange={(event) => setWorkEnd(event.target.value)}
            />
          </label>

          <label>
            <span>Heure habituelle de réveil</span>
            <input
              type="time"
              value={wakeTime}
              onChange={(event) => setWakeTime(event.target.value)}
            />
          </label>

          <label>
            <span>Heure idéale de coucher</span>
            <input
              type="time"
              value={bedTime}
              onChange={(event) => setBedTime(event.target.value)}
            />
          </label>

          <label>
            <span>Priorité principale actuelle</span>
            <select
              value={mainPriority}
              onChange={(event) => setMainPriority(event.target.value)}
              required
            >
              <option value="">Choisir</option>
              <option value="family">Famille</option>
              <option value="study">Études ou formation</option>
              <option value="sleep">Sommeil</option>
              <option value="sport">Sport</option>
              <option value="personal_time">Temps personnel</option>
              <option value="work">Travail</option>
            </select>
          </label>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>
        </form>
      </section>
    </main>
  );
}
