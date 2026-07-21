import { Navigate, Link } from "react-router-dom";

import { CalendarsSettingsPanel } from "../components/settings/CalendarsSettingsPanel";
import { isCalendarSyncEngineEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { AppRoutes } from "../lib/navigation/routes";

export function CalendarsSettingsPage() {
  useAppPageTitle("Calendriers");

  const { user } = useAuth();

  if (!isCalendarSyncEngineEnabled()) {
    return <Navigate to={AppRoutes.USER_PROFILE} replace />;
  }

  if (!user) {
    return (
      <main className="dashboard-page calendars-settings-page">
        <section className="dashboard-container">
          <p>Connexion requise.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page calendars-settings-page">
      <section className="dashboard-container">
        <header className="page-header">
          <div>
            <p className="card-label">Paramètres</p>
            <h1>Calendriers</h1>
            <p className="planning-hint">
              Synchronisation bidirectionnelle via le moteur de sync — le Planning Engine
              reste la source unique pour l&apos;application.
            </p>
          </div>
          <Link to={AppRoutes.USER_PROFILE} className="text-link">
            ← Retour au profil
          </Link>
        </header>

        <CalendarsSettingsPanel userId={user.id} />
      </section>
    </main>
  );
}
