import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import {
  mapPasswordRecoveryError,
  PASSWORD_RESET_EMAIL_SENT_MESSAGE,
} from "../lib/auth/passwordRecovery";
import { AppRoutes } from "../lib/navigation/routes";
import { requestPasswordResetEmail } from "../services/passwordRecoveryService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setLoading(true);
      await requestPasswordResetEmail(email);
      setSuccessMessage(PASSWORD_RESET_EMAIL_SENT_MESSAGE);
    } catch (error) {
      setErrorMessage(mapPasswordRecoveryError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Mot de passe oublié ?</h1>

        <p className="auth-intro">
          Saisis ton adresse e-mail. Nous t&apos;enverrons un lien pour
          définir un nouveau mot de passe.
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

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to={AppRoutes.LOGIN}>Retour à la connexion</Link>
        </p>
      </section>
    </main>
  );
}
