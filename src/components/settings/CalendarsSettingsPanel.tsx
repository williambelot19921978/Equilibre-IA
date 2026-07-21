import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createGoogleCalendarConnector,
  defaultSyncEventBus,
  defaultSynchronizationEngine,
  describeOAuthState,
  getSyncHistory,
  type ConflictResolution,
} from "../../calendarSyncEngine";
import {
  isCalendarSyncEngineEnabled,
  isGoogleCalendarEnabled,
} from "../../config/featureFlags";
import { getCurrentHouseholdId } from "../../services/householdService";
import { loadExternalEventsForDate } from "../../services/googleCalendarService";
import { Button } from "../ui/Button";

type CalendarsSettingsPanelProps = {
  readonly userId: string;
};

function formatSyncDate(iso: string | null | undefined): string {
  if (!iso) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function lifecycleLabel(status: string): string {
  switch (status) {
    case "synced":
      return "Synchronisé";
    case "syncing":
      return "Synchronisation…";
    case "pending":
      return "En attente";
    case "conflict":
      return "Conflit";
    case "failed":
      return "Échec";
    case "external_deleted":
      return "Supprimé (externe)";
    case "local_deleted":
      return "Supprimé (local)";
    default:
      return status;
  }
}

export function CalendarsSettingsPanel({ userId }: CalendarsSettingsPanelProps) {
  const connector = useMemo(() => createGoogleCalendarConnector(), []);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [oauthState, setOauthState] = useState("Non connecté");
  const [accountEmail, setAccountEmail] = useState<string | undefined>();
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(getSyncHistory());
  const [conflicts, setConflicts] = useState<readonly ConflictResolution[]>([]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const activeHouseholdId = await getCurrentHouseholdId(userId);
      setHouseholdId(activeHouseholdId);
      connector.setContext({ userId, householdId: activeHouseholdId });

      const session = await connector.getOAuthSession();
      setOauthState(describeOAuthState(session));
      setAccountEmail(session.accountEmail);
      setLastSyncedAt(session.lastSyncedAt ?? null);
      setSyncStatus(session.state === "connected" ? "synced" : session.state);

      const today = new Date().toISOString().slice(0, 10);
      const records = await loadExternalEventsForDate({
        userId,
        householdId: activeHouseholdId,
        date: today,
      });
      setEventCount(records.length);
      setHistory(getSyncHistory());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les calendriers.",
      );
    } finally {
      setLoading(false);
    }
  }, [connector, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const unsubscribe = defaultSyncEventBus.subscribe((event) => {
      if (event.type === "ConflictDetected") {
        setConflicts(event.payload.resolutions);
      }
      if (event.type === "SyncCompleted") {
        setHistory(getSyncHistory());
        void reload();
      }
    });
    return unsubscribe;
  }, [reload]);

  const isConnected = oauthState === "Connecté";

  async function handleConnect() {
    if (!householdId) return;
    connector.setContext({ userId, householdId });
    const result = await connector.connect();
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    if (!result.success) {
      setError(result.message);
    }
  }

  async function handleSync() {
    if (!householdId) return;
    setSyncing(true);
    setMessage("");
    setError("");
    setSyncStatus("syncing");

    const rangeStart = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const rangeEnd = new Date().toISOString().slice(0, 10) + "T23:59:59.999Z";

    const result = await defaultSynchronizationEngine.pull(
      { userId, householdId, rangeStart, rangeEnd },
      { force: true },
    );

    setSyncStatus(result.success ? "synced" : "failed");
    setMessage(result.message);
    if (!result.success) {
      setError(result.message);
    }
    await reload();
    setSyncing(false);
  }

  async function handleDisconnect() {
    if (!householdId) return;
    setSyncing(true);
    connector.setContext({ userId, householdId });
    const result = await connector.disconnect();
    setMessage(result.message);
    if (!result.success) {
      setError(result.message);
    }
    await reload();
    setSyncing(false);
  }

  if (!isGoogleCalendarEnabled() || !isCalendarSyncEngineEnabled()) {
    return (
      <section className="google-calendar-integrations">
        <p className="planning-hint">
          La synchronisation calendrier est désactivée. Activez{" "}
          <code>VITE_GOOGLE_CALENDAR_ENABLED</code> et{" "}
          <code>VITE_CALENDAR_SYNC_ENGINE</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="google-calendar-integrations calendars-settings-panel">
      <div className="section-heading">
        <div>
          <p className="card-label">Paramètres</p>
          <h2>Calendriers</h2>
        </div>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <>
          <div className="google-connection-status">
            <span>Google Calendar</span>
            <strong>{isConnected ? "Connecté" : oauthState}</strong>
          </div>

          {accountEmail && (
            <div className="google-connection-status">
              <span>Compte</span>
              <strong>{accountEmail}</strong>
            </div>
          )}

          <div className="google-connection-status">
            <span>Dernière synchronisation</span>
            <strong>{formatSyncDate(lastSyncedAt)}</strong>
          </div>

          <div className="google-connection-status">
            <span>Événements (aujourd&apos;hui)</span>
            <strong>{eventCount}</strong>
          </div>

          <div className="google-connection-status">
            <span>État</span>
            <strong>{lifecycleLabel(syncStatus)}</strong>
          </div>

          <div className="google-connection-actions">
            {!isConnected ? (
              <Button type="button" onClick={() => void handleConnect()}>
                Connecter Google
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  loading={syncing}
                  onClick={() => void handleSync()}
                >
                  Synchroniser
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={syncing}
                  onClick={() => void handleDisconnect()}
                >
                  Déconnecter
                </Button>
              </>
            )}
          </div>

          {conflicts.length > 0 && (
            <div className="sync-conflicts-panel">
              <h3>Conflits détectés — résolution manuelle requise</h3>
              <ul>
                {conflicts.map((resolution) => (
                  <li key={resolution.id}>
                    <strong>{resolution.message}</strong>
                    <div className="sync-conflict-preview">
                      <p>Avant : {resolution.preview.before.join(" · ")}</p>
                      <p>Après : {resolution.preview.after.join(" · ")}</p>
                      <p>
                        Source → Destination : {resolution.preview.source} →{" "}
                        {resolution.preview.destination}
                      </p>
                      <p>Différences : {resolution.preview.differences.join(", ")}</p>
                      <p>Impact : {resolution.preview.impact}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {history.length > 0 && (
            <div className="sync-history-panel">
              <h3>Historique</h3>
              <ul>
                {history.slice(0, 10).map((entry) => (
                  <li key={entry.id}>
                    {formatSyncDate(entry.timestamp)} — {entry.direction} —{" "}
                    {lifecycleLabel(entry.status)} — {entry.itemCount} événement(s) —{" "}
                    {entry.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {message && <div className="message message-success">{message}</div>}
      {error && <div className="message message-error">{error}</div>}
    </section>
  );
}
