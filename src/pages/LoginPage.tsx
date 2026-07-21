import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { mapAuthError } from "../lib/errors/userFacingError";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useUserProgress } from "../hooks/useUserProgress";
import { AppRoutes } from "../lib/navigation/routes";
import { Button } from "../components/ui/Button";
import { FormField, Input } from "../components/ui/FormField";

type LoginLocationState = {
  from?: { pathname?: string };
  passwordResetSuccess?: string;
};

export function LoginPage() {
  const { goToResolvedRoute } = useAppNavigation();
  const { refreshProgress, isCurrentRouteAllowed } = useUserProgress();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginLocationState;
  const passwordResetSuccess =
    typeof state.passwordResetSuccess === "string" ? state.passwordResetSuccess : "";

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

      await refreshProgress();
      const redirectPath = state.from?.pathname;
      if (redirectPath && isCurrentRouteAllowed(redirectPath)) {
        navigate(redirectPath, { replace: true });
        return;
      }

      await goToResolvedRoute();
    } catch (error) {
      setErrorMessage(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Aura</p>

        <h1>Bon retour</h1>

        <p className="auth-intro">
          Connecte-toi pour retrouver ton espace familial.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <FormField label="Adresse e-mail" htmlFor="login-email" required>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </FormField>

          <FormField label="Mot de passe" htmlFor="login-password" required>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </FormField>

          <p className="auth-forgot-password">
            <Link to={AppRoutes.FORGOT_PASSWORD}>Mot de passe oublié ?</Link>
          </p>

          {errorMessage && (
            <div className="message message-error" role="alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="message message-success" role="status">
              {successMessage}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Se connecter
          </Button>
        </form>

        <p className="auth-footer">
          Pas encore de compte ?{" "}
          <Link to={AppRoutes.SIGNUP}>Créer un compte</Link>
        </p>
      </section>
    </main>
  );
}
