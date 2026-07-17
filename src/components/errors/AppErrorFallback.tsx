import { APP_BETA_LABEL, APP_VERSION } from "../../config/appVersion";
import { AppRoutes } from "../../lib/navigation/routes";
import { Button } from "../ui/Button";

type AppErrorFallbackProps = {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
};

export function AppErrorFallback({
  error,
  onRetry,
  title = "Une erreur inattendue s’est produite",
  description = "L’application a rencontré un problème. Tu peux réessayer ou revenir à l’accueil.",
}: AppErrorFallbackProps) {
  const showDetails = import.meta.env.DEV && error?.message;

  return (
    <main className="auth-page app-error-page">
      <section className="empty-card app-error-card">
        <p className="card-label">{APP_BETA_LABEL}</p>
        <h1>{title}</h1>
        <p>{description}</p>

        {showDetails && (
          <pre className="app-error-details" aria-live="polite">
            {error?.message}
          </pre>
        )}

        <div className="app-error-actions">
          {onRetry && (
            <Button type="button" onClick={onRetry}>
              Réessayer
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.location.href = AppRoutes.HOME;
            }}
          >
            Revenir à l’accueil
          </Button>
        </div>

        <small className="app-error-version">v{APP_VERSION}</small>
      </section>
    </main>
  );
}
