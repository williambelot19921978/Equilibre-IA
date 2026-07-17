import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { AppRoutes } from "../lib/navigation/routes";

export function LoginPage() {
  const { goToResolvedRoute } = useAppNavigation();
  const location = useLocation();
  const passwordResetSuccess =
    typeof location.state === "object" &&
    location.state !== null &&
    "passwordResetSuccess" in location.state &&
    typeof (location.state as { passwordResetSuccess?: unknown })
      .passwordResetSuccess === "string"
      ? (location.state as { passwordResetSuccess: string }).passwordResetSuccess
      : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(passwordResetSuccess);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      await goToResolvedRoute();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de se connecter.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Bon retour</h1>

        <p className="auth-intro">
          Connecte-toi pour retrouver ton espace familial.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
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
              autoComplete="current-password"
              required
            />
          </label>

          <p className="auth-forgot-password">
            <Link to={AppRoutes.FORGOT_PASSWORD}>Mot de passe oublié ?</Link>
          </p>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="auth-footer">
          Pas encore de compte ?{" "}
          <Link to={AppRoutes.SIGNUP}>Créer un compte</Link>
        </p>
      </section>
    </main>
  );
}
