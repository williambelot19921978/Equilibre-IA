import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import {
  buildSecuritySnapshot,
  signOutAllDevices,
  signOutCurrentDevice,
  type SecuritySnapshot,
} from "../../trustCenter";

type SecurityPanelProps = {
  userId: string;
  user: { id: string; email?: string | null; last_sign_in_at?: string } | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SecurityPanel({ userId, user }: SecurityPanelProps) {
  const [snapshot, setSnapshot] = useState<SecuritySnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void buildSecuritySnapshot(user).then(setSnapshot);
  }, [user]);

  async function handleSignOutCurrent() {
    setBusy(true);
    await signOutCurrentDevice(userId);
  }

  async function handleSignOutAll() {
    if (!window.confirm("Déconnecter Aura sur tous vos appareils ?")) return;
    setBusy(true);
    await signOutAllDevices(userId);
  }

  return (
    <section className="trust-security" data-testid="trust-security">
      <h2 className="aura-h2">Sécurité</h2>
      {snapshot && (
        <ul className="trust-security-list aura-glass">
          <li>
            <span>Dernière connexion</span>
            <strong>{formatWhen(snapshot.lastSignInAt)}</strong>
          </li>
          <li>
            <span>Appareil actuel</span>
            <strong>{snapshot.currentDeviceLabel}</strong>
          </li>
          <li>
            <span>Session active</span>
            <strong>{snapshot.isSessionFresh ? "Oui" : "Expirée"}</strong>
          </li>
          <li>
            <span>Expire le</span>
            <strong>{formatWhen(snapshot.sessionExpiresAt)}</strong>
          </li>
        </ul>
      )}
      <div className="trust-security-actions">
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleSignOutCurrent()}>
          Déconnexion
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleSignOutAll()}>
          Déconnexion de tous les appareils
        </Button>
      </div>
    </section>
  );
}
