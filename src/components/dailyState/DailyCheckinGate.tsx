import { Navigate, useLocation } from "react-router-dom";

import { defaultDailyStateEngine, getSkipRecords } from "../../dailyStateEngine";
import { isDailyStateEngineEnabled } from "../../config/featureFlags";
import { useAuth } from "../../hooks/useAuth";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";
import { isDailyCheckinEnabledForUser } from "../../lib/preferences/dailyCheckinPreference";
import { AppRoutes } from "../../lib/navigation/routes";

const BYPASS_ROUTES = new Set<string>([
  AppRoutes.DAILY_CHECK_IN,
  AppRoutes.DAILY_STATE_HISTORY,
  AppRoutes.LOGIN,
  AppRoutes.SIGNUP,
  AppRoutes.SETTINGS,
]);

/**
 * EPIC 7A — Plus de blocage hard : le check-in reste invité, jamais forcé.
 * La redirection n'a lieu que si l'utilisateur a activé le check-in ET n'a pas skip aujourd'hui.
 */
export function DailyCheckinGate({ children }: { readonly children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!isDailyStateEngineEnabled() || !user?.id) {
    return children;
  }

  if (BYPASS_ROUTES.has(location.pathname)) {
    return children;
  }

  if (!isDailyCheckinEnabledForUser(user.id)) {
    return children;
  }

  const date = getCurrentDeviceDate();
  const snapshot = defaultDailyStateEngine.analyze(user.id, date);
  const skippedToday = getSkipRecords(user.id).some((skip) => skip.date === date);

  if (!snapshot.hasCheckinToday && !skippedToday && location.pathname === AppRoutes.HOME) {
    return <Navigate to={AppRoutes.DAILY_CHECK_IN} replace />;
  }

  return children;
}
