import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  isPasswordRecoveryCallback,
  mapPasswordRecoveryError,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  validateNewPassword,
} from "../lib/auth/passwordRecovery";
import { AppRoutes } from "../lib/navigation/routes";
import { supabase } from "../lib/supabase/client";
import {
  updatePasswordAfterRecovery,
} from "../services/passwordRecoveryService";

type ResetPasswordStatus = "loading" | "ready" | "expired" | "success";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ResetPasswordStatus>("loading");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let resolved = false;

    function markReady() {
      if (!active || resolved) return;
      resolved = true;
      setStatus("ready");
    }

    function markExpired() {
      if (!active || resolved) return;
      resolved = true;
      setStatus("expired");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        markReady();
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || resolved) return;

      if (
        session &&
        isPasswordRecoveryCallback(window.location)
      ) {
        markReady();
      }
    });

    const timeoutId = window.setTimeout(() => {
      if (!active || resolved) return;
      markExpired();
    }, 4000);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const validationError = validateNewPassword(password, passwordConfirmation);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      await updatePasswordAfterRecovery(password);
      await supabase.auth.signOut();
      setStatus("success");
      window.setTimeout(() => {
        void navigate(AppRoutes.LOGIN, {
          replace: true,
          state: { passwordResetSuccess: PASSWORD_RESET_SUCCESS_MESSAGE },
        });
      }, 1200);
    } catch (error) {
      setErrorMessage(mapPasswordRecoveryError(error));
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="brand-name">Équilibre IA</p>
          <h1>Vérification du lien</h1>
          <p className="auth-intro">Patiente quelques instants…</p>
        </section>
      </main>
    );
  }

  if (status === "expired") {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="brand-name">Équilibre IA</p>
          <h1>Lien expiré</h1>
          <p className="auth-intro">
            Ce lien de réinitialisation n&apos;est plus valide. Demande un
            nouveau lien pour continuer.
          </p>
          <div className="message message-error">
            Ce lien a expiré ou a déjà été utilisé.
          </div>
          <p className="auth-footer">
            <Link to={AppRoutes.FORGOT_PASSWORD}>Demander un nouveau lien</Link>
          </p>
          <p className="auth-footer">
            <Link to={AppRoutes.LOGIN}>Retour à la connexion</Link>
          </p>
        </section>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="brand-name">Équilibre IA</p>
          <h1>Mot de passe mis à jour</h1>
          <div className="message message-success">
            {PASSWORD_RESET_SUCCESS_MESSAGE}
          </div>
          <p className="auth-intro">Redirection vers la connexion…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Équilibre IA</p>

        <h1>Nouveau mot de passe</h1>

        <p className="auth-intro">
          Choisis un nouveau mot de passe pour ton compte Équilibre IA.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Nouveau mot de passe</span>
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
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to={AppRoutes.LOGIN}>Retour à la connexion</Link>
        </p>
      </section>
    </main>
  );
}
