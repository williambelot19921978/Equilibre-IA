import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { AppRoutes } from "../../lib/navigation/routes";
import { useAuth } from "../../hooks/useAuth";
import { useUserProgress } from "../../hooks/useUserProgress";

function LoadingScreen() {
  return (
    <main className="auth-page">
      <p>Chargement...</p>
    </main>
  );
}

function ProgressErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="auth-page">
      <section className="empty-card app-error-card aura-glass">
        <h1>Impossible de charger ton profil</h1>
        <p>{message}</p>
        <Button type="button" onClick={onRetry}>
          Réessayer
        </Button>
      </section>
    </main>
  );
}

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const {
    loading: progressLoading,
    progressError,
    isCurrentRouteAllowed,
    resolvedRoute,
    refreshProgress,
  } = useUserProgress();
  const location = useLocation();

  if (authLoading || progressLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to={AppRoutes.LOGIN} replace state={{ from: location }} />;
  }

  if (progressError) {
    return (
      <ProgressErrorScreen
        message={progressError}
        onRetry={() => {
          void refreshProgress();
        }}
      />
    );
  }

  if (!isCurrentRouteAllowed(location.pathname)) {
    return <Navigate to={resolvedRoute} replace />;
  }

  return <Outlet />;
}
