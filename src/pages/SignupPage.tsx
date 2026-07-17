import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { AppRoutes } from "../lib/navigation/routes";

export function SignupPage() {
  const { goToResolvedRoute } = useAppNavigation();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!firstName.trim()) {
      setErrorMessage("Indique ton prénom.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Le mot de passe doit contenir au moins 8 caractères.",
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
          },
          emailRedirectTo: `${window.location.origin}${AppRoutes.LOGIN}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await goToResolvedRoute();
        return;
      }

      setSuccessMessage(
        "Ton compte a été créé. Consulte tes e-mails pour confirmer ton inscription.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer le compte.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Créer mon compte</h1>

        <p className="auth-intro">
          Commençons par les informations essentielles.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Prénom</span>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </label>

          <label>
            <span>Adresse e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label>
            <span>Confirmer le mot de passe</span>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-footer">
          Déjà inscrit ? <Link to={AppRoutes.LOGIN}>Se connecter</Link>
        </p>
      </section>
    </main>
  );
}
