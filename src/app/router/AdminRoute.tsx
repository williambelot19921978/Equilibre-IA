import { Navigate, Outlet } from "react-router-dom";

import { isAuraAdmin } from "../../auraInsights/adminAccess";
import { useAuth } from "../../hooks/useAuth";
import { AppRoutes } from "../../lib/navigation/routes";

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p role="status">Vérification des droits…</p>;
  }

  if (!user || !isAuraAdmin(user.email, user.app_metadata)) {
    return <Navigate to={AppRoutes.SETTINGS} replace state={{ adminDenied: true }} />;
  }

  return <Outlet />;
}
