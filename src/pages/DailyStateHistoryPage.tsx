import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import {
  buildDailyStateDiagnostics,
  defaultDailyStateEngine,
  getCheckinMode,
  setCheckinMode,
  type CheckinMode,
  type DailyStateDiagnostics,
} from "../dailyStateEngine";
import { isDailyStateEngineEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";

export function DailyStateHistoryPage() {
  useAppPageTitle("Historique ressenti");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DailyStateDiagnostics | null>(null);
  const [checkinMode, setLocalCheckinMode] = useState<CheckinMode>("standard");

  useEffect(() => {
    if (!user?.id || !isDailyStateEngineEnabled()) return;
    setLocalCheckinMode(getCheckinMode(user.id));
    void buildDailyStateDiagnostics({ userId: user.id, date: getCurrentDeviceDate() }).then(
      setDiagnostics,
    );
  }, [user?.id]);

  function handleModeChange(mode: CheckinMode) {
    if (!user?.id) return;
    defaultDailyStateEngine.updateMode(user.id, mode);
    setCheckinMode(user.id, mode);
    setLocalCheckinMode(mode);
  }

  if (!isDailyStateEngineEnabled()) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="daily-state-history-page" data-testid="daily-state-history-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Organisation</p>
        <h1>Historique &amp; évolution</h1>
        <p>Tendances déclarées — aucun diagnostic médical.</p>
      </header>

      <section className="daily-state-settings" data-testid="daily-state-settings">
        <h2>Mode check-in</h2>
        <p>Standard par défaut — humeur, énergie, stress et sommeil.</p>
        <div className="daily-state-mode-options">
          {(["quick", "standard", "complete"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={checkinMode === mode ? "selected" : ""}
              onClick={() => handleModeChange(mode)}
            >
              {mode === "quick" ? "Rapide" : mode === "standard" ? "Standard" : "Complet"}
            </button>
          ))}
        </div>
      </section>

      {diagnostics && (
        <>
          <section className="daily-state-trends">
            <h2>7 jours</h2>
            <ul>
              <li>Énergie moyenne : {diagnostics.trends7d.averageEnergy}/10</li>
              <li>Stress moyen : {diagnostics.trends7d.averageStress}/10</li>
              <li>Sommeil moyen : {diagnostics.trends7d.averageSleepQuality}/5</li>
              <li>Évolution : {diagnostics.trends7d.evolution}</li>
            </ul>
            <h2>30 jours</h2>
            <ul>
              <li>Énergie : {diagnostics.trends30d.averageEnergy}/10</li>
              <li>Stress : {diagnostics.trends30d.averageStress}/10</li>
            </ul>
            <h2>12 mois</h2>
            <ul>
              <li>Échantillons : {diagnostics.trends12m.sampleCount}</li>
              <li>Fatigue moyenne : {diagnostics.trends12m.averageFatigue}/10</li>
            </ul>
          </section>

          {diagnostics.today && (
            <section>
              <h2>Aujourd&apos;hui</h2>
              <p>
                Humeur {diagnostics.today.mood} — énergie {diagnostics.today.energy}/10 — stress{" "}
                {diagnostics.today.stress}/10
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
