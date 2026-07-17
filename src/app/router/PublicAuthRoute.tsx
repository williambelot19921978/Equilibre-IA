import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

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

export function PublicAuthRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { resolvedRoute, loading: progressLoading } = useUserProgress();

  if (authLoading || (user && progressLoading)) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to={resolvedRoute} replace />;
  }

  return children;
}

export function RootRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { resolvedRoute, loading: progressLoading } = useUserProgress();

  if (authLoading || (user && progressLoading)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to={AppRoutes.LOGIN} replace />;
  }

  return <Navigate to={resolvedRoute} replace />;
}
