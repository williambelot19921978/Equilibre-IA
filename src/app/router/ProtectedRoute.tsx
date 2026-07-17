import { Navigate, Outlet, useLocation } from "react-router-dom";

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

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { loading: progressLoading, isCurrentRouteAllowed, resolvedRoute } =
    useUserProgress();
  const location = useLocation();

  if (authLoading || progressLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to={AppRoutes.LOGIN} replace />;
  }

  if (!isCurrentRouteAllowed(location.pathname)) {
    return <Navigate to={resolvedRoute} replace />;
  }

  return <Outlet />;
}
