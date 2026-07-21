import { Navigate } from "react-router-dom";

import { DailyCheckinFlow } from "../components/dailyState/DailyCheckinFlow";
import { isDailyStateEngineEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { AppRoutes } from "../lib/navigation/routes";

export function DailyCheckinPage() {
  useAppPageTitle("Check-in quotidien");

  if (!isDailyStateEngineEnabled()) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="daily-checkin-page" data-testid="daily-checkin-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Bienvenue</p>
        <h1>Check-in du jour</h1>
        <p>30 secondes pour partager ton ressenti — facultatif, jamais bloquant.</p>
      </header>
      <DailyCheckinFlow />
    </main>
  );
}
