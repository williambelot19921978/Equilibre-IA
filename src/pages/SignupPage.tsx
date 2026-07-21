import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { mapSignupError } from "../lib/errors/userFacingError";
import { trackInsightEvent } from "../auraInsights/eventStore";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { AppRoutes } from "../lib/navigation/routes";
import { Button } from "../components/ui/Button";
import { FormField, Input } from "../components/ui/FormField";

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

      if (data.session?.user?.id) {
        trackInsightEvent(data.session.user.id, "account_created", {});
        await goToResolvedRoute();
        return;
      }

      if (data.user?.id) {
        trackInsightEvent(data.user.id, "account_created", {});
      }

      setSuccessMessage(
        "Ton compte a été créé. Consulte tes e-mails pour confirmer ton inscription.",
      );
    } catch (error) {
      setErrorMessage(mapSignupError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Aura</p>

        <h1>Créer mon compte</h1>

        <p className="auth-intro">
          Commençons par les informations essentielles.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <FormField label="Prénom" htmlFor="signup-first-name" required>
            <Input
              id="signup-first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </FormField>

          <FormField label="Adresse e-mail" htmlFor="signup-email" required>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </FormField>

          <FormField label="Mot de passe" htmlFor="signup-password" required>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>

          <FormField
            label="Confirmer le mot de passe"
            htmlFor="signup-password-confirm"
            required
          >
            <Input
              id="signup-password-confirm"
              type="password"
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <Button type="submit" fullWidth disabled={loading} loading={loading}>
            {loading ? "Création du compte..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="auth-footer">
          Déjà inscrit ? <Link to={AppRoutes.LOGIN}>Se connecter</Link>
        </p>
      </section>
    </main>
  );
}
