import { AuraIllustration } from "../aura/AuraIllustration";
import {
  APP_VERSION,
  formatDisplayVersion,
  getChannelLabel,
  getReleaseChannel,
} from "../../release";
import { stashErrorReport } from "../../release/errorReport";
import { AppRoutes } from "../../lib/navigation/routes";
import { Button } from "../ui/Button";

type AppErrorFallbackProps = {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  userId?: string | null;
};

export function AppErrorFallback({
  error,
  onRetry,
  title = "Une erreur inattendue s'est produite",
  description = "L'application a rencontré un problème. Tu peux réessayer ou revenir à l'accueil.",
  userId = null,
}: AppErrorFallbackProps) {
  const showDetails = import.meta.env.DEV && error?.message;
  const channel = getChannelLabel(getReleaseChannel());

  function handleReport() {
    stashErrorReport(error ?? null, "error-fallback");
    window.location.href = userId ? AppRoutes.TRUST_CENTER : AppRoutes.LOGIN;
  }

  return (
    <main className="auth-page app-error-page" role="alert" aria-live="assertive">
      <section className="empty-card app-error-card aura-glass">
        <AuraIllustration kind="error" title={title} description={description} />

        {showDetails && (
          <pre className="app-error-details">{error?.message}</pre>
        )}

        <div className="app-error-actions">
          {onRetry && (
            <Button type="button" onClick={onRetry} data-testid="error-retry">
              Réessayer
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.location.href = AppRoutes.HOME;
            }}
            data-testid="error-home"
          >
            Retour accueil
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReport}
            data-testid="error-report"
          >
            Signaler
          </Button>
        </div>

        <small className="app-error-version">
          {formatDisplayVersion(APP_VERSION)} · {channel}
        </small>
      </section>
    </main>
  );
}
