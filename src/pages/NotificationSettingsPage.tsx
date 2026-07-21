import { useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAuth } from "../hooks/useAuth";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  requestNotificationPermission,
  setChannelEnabled,
  setNotificationLevel,
  setNotificationPreferences,
  type NotificationChannelId,
  type NotificationLevel,
} from "../mobileReliability";

const LEVELS: { value: NotificationLevel; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "important", label: "Seulement importantes" },
  { value: "silent", label: "Silencieuses" },
  { value: "none", label: "Aucune" },
];

const CHANNELS: { id: NotificationChannelId; label: string }[] = [
  { id: "coach", label: "Coach" },
  { id: "checkin", label: "Check-in" },
  { id: "planning", label: "Planning" },
  { id: "goals", label: "Objectifs" },
  { id: "digest", label: "Digest" },
];

export function NotificationSettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(
    user?.id ? getNotificationPreferences(user.id) : DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [permission, setPermission] = useState<string>("default");

  async function handleRequestPermission() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  function updateLevel(level: NotificationLevel) {
    if (!user?.id) return;
    setPrefs(setNotificationLevel(user.id, level));
  }

  function toggleChannel(channelId: NotificationChannelId) {
    if (!user?.id) return;
    setPrefs(setChannelEnabled(user.id, channelId, !prefs.channels[channelId]));
  }

  function updateQuietHours(field: "quietStart" | "quietEnd", value: string) {
    if (!user?.id) return;
    setPrefs(setNotificationPreferences(user.id, { [field]: value }));
  }

  return (
    <PageContainer>
      <SectionHeader
        label="Notifications"
        title="Vos préférences"
        subtitle="Les notifications proviennent uniquement du moteur proactif — jamais sans règles validées."
      />

      <div className="settings-sections">
        <Card className="settings-section-card">
          <h2>Niveau</h2>
          <div className="notification-level-grid">
            {LEVELS.map((level) => (
              <Button
                key={level.value}
                variant={prefs.level === level.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => updateLevel(level.value)}
                data-testid={`notification-level-${level.value}`}
              >
                {level.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="settings-section-card">
          <h2>Canaux</h2>
          <ul className="notification-channel-list">
            {CHANNELS.map((channel) => (
              <li key={channel.id}>
                <span>{channel.label}</span>
                <Button
                  size="sm"
                  variant={prefs.channels[channel.id] ? "primary" : "secondary"}
                  onClick={() => toggleChannel(channel.id)}
                >
                  {prefs.channels[channel.id] ? "Activé" : "Désactivé"}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="settings-section-card">
          <h2>Horaires</h2>
          <label className="ds-form-field">
            <span className="ds-form-field-label">Heures calmes — début</span>
            <input
              className="ds-input ds-input-full"
              type="time"
              value={prefs.quietStart}
              onChange={(event) => updateQuietHours("quietStart", event.target.value)}
            />
          </label>
          <label className="ds-form-field">
            <span className="ds-form-field-label">Heures calmes — fin</span>
            <input
              className="ds-input ds-input-full"
              type="time"
              value={prefs.quietEnd}
              onChange={(event) => updateQuietHours("quietEnd", event.target.value)}
            />
          </label>
        </Card>

        <Card className="settings-section-card">
          <h2>Permission navigateur</h2>
          <p>Autorisez les notifications push de votre navigateur ou appareil.</p>
          <Button variant="secondary" onClick={() => void handleRequestPermission()}>
            Demander la permission
          </Button>
          {permission !== "default" && <p>Statut : {permission}</p>}
        </Card>
      </div>
    </PageContainer>
  );
}
