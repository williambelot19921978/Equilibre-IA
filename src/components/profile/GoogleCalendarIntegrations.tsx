import { useCallback, useEffect, useState } from "react";

import { isGoogleCalendarEnabled } from "../../config/featureFlags";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnection,
  listGoogleCalendars,
  maybeAutoSyncGoogleCalendar,
  startGoogleCalendarAuth,
  syncGoogleCalendar,
  updateGoogleCalendarSelection,
} from "../../services/googleCalendarService";
import { getCurrentHouseholdId } from "../../services/householdService";
import type {
  GoogleCalendarConnectionRecord,
  GoogleCalendarRecord,
} from "../../types/googleCalendar";
import { Button } from "../ui/Button";

type GoogleCalendarIntegrationsProps = {
  userId: string;
};

function formatSyncDate(iso: string | null): string {
  if (!iso) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function GoogleCalendarComingSoon() {
  return (
    <section className="google-calendar-integrations">
      <div className="section-heading">
        <div>
          <p className="card-label">Intégrations</p>
          <h2>Calendriers connectés</h2>
        </div>
      </div>

      <div className="google-calendar-coming-soon">
        <p>
          <strong>Google Calendar — bientôt disponible</strong>
        </p>
        <p className="planning-hint">
          L’import automatique de tes événements Google sera activé dans une
          prochaine version. Le reste de l’application fonctionne normalement.
        </p>
      </div>
    </section>
  );
}

export function GoogleCalendarIntegrations({
  userId,
}: GoogleCalendarIntegrationsProps) {
  if (!isGoogleCalendarEnabled()) {
    return <GoogleCalendarComingSoon />;
  }

  return <GoogleCalendarIntegrationsActive userId={userId} />;
}

function GoogleCalendarIntegrationsActive({
  userId,
}: GoogleCalendarIntegrationsProps) {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [connection, setConnection] =
    useState<GoogleCalendarConnectionRecord | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const activeHouseholdId = await getCurrentHouseholdId(userId);
      setHouseholdId(activeHouseholdId);

      const activeConnection = await getGoogleCalendarConnection(
        userId,
        activeHouseholdId,
      );
      setConnection(activeConnection);

      if (activeConnection) {
        const listed = await listGoogleCalendars(activeConnection.id);
        setCalendars(listed);
        await maybeAutoSyncGoogleCalendar({ householdId: activeHouseholdId });
      } else {
        setCalendars([]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les calendriers connectés.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleConnect() {
    if (!householdId) return;

    try {
      setError("");
      const { authUrl } = await startGoogleCalendarAuth({
        householdId,
        redirectAfter: "/profile",
      });
      window.location.href = authUrl;
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Impossible de démarrer la connexion Google.",
      );
    }
  }

  async function handleSync() {
    if (!householdId) return;

    try {
      setSyncing(true);
      setMessage("");
      const result = await syncGoogleCalendar({
        householdId,
        userId,
        force: true,
      });
      setMessage(
        result.message ??
          `${result.synced} événement(s) synchronisé(s).`,
      );
      await reload();
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Synchronisation impossible.",
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!householdId) return;

    try {
      setSyncing(true);
      await disconnectGoogleCalendar({ householdId });
      setConnection(null);
      setCalendars([]);
      setMessage("Google Calendar déconnecté.");
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Déconnexion impossible.",
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleCalendar(calendarId: string, selected: boolean) {
    try {
      await updateGoogleCalendarSelection({ calendarId, selected });
      setCalendars((current) =>
        current.map((calendar) =>
          calendar.id === calendarId
            ? { ...calendar, selected_for_sync: selected }
            : calendar,
        ),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Impossible de mettre à jour la sélection.",
      );
    }
  }

  const isConnected =
    connection?.status === "connected" && Boolean(connection.google_account_email);

  return (
    <section className="google-calendar-integrations">
      <div className="section-heading">
        <div>
          <p className="card-label">Intégrations</p>
          <h2>Calendriers connectés</h2>
        </div>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <>
          <div className="google-connection-status">
            <span>État</span>
            <strong>{isConnected ? "Connecté" : "Non connecté"}</strong>
          </div>

          {isConnected && connection && (
            <>
              <div className="google-connection-status">
                <span>Compte Google</span>
                <strong>{connection.google_account_email}</strong>
              </div>
              <div className="google-connection-status">
                <span>Dernière synchronisation</span>
                <strong>{formatSyncDate(connection.last_synced_at)}</strong>
              </div>
            </>
          )}

          <div className="google-connection-actions">
            {!isConnected ? (
              <Button type="button" onClick={() => void handleConnect()}>
                Connecter Google Calendar
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  loading={syncing}
                  onClick={() => void handleSync()}
                >
                  Synchroniser maintenant
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

          {calendars.length > 0 && (
            <div className="google-calendar-list">
              <h3>Calendriers Google disponibles</h3>
              <ul>
                {calendars.map((calendar) => (
                  <li key={calendar.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={calendar.selected_for_sync}
                        onChange={(event) =>
                          void handleToggleCalendar(
                            calendar.id,
                            event.target.checked,
                          )
                        }
                      />
                      {calendar.name}
                      {calendar.is_primary && " (principal)"}
                    </label>
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
