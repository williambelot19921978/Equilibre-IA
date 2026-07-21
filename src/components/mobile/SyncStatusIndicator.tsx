import { useMobileReliability } from "../../contexts/MobileReliabilityProvider";

const STATUS_LABELS = {
  synced: "Synchronisé",
  pending: "En attente",
  syncing: "Synchronisation…",
  offline: "Hors ligne",
  error: "Erreur sync",
} as const;

export function SyncStatusIndicator() {
  const { sync, refreshSync, connectivity } = useMobileReliability();

  if (!sync) return null;

  const label = STATUS_LABELS[sync.status];

  return (
    <button
      type="button"
      className={`sync-status-indicator sync-status-${sync.status}`}
      onClick={refreshSync}
      aria-live="polite"
      data-testid="sync-status-indicator"
      title={
        sync.lastSyncedAt
          ? `Dernière sync : ${new Date(sync.lastSyncedAt).toLocaleString("fr-FR")}`
          : label
      }
    >
      <span className="sync-status-dot" aria-hidden="true" />
      <span>{label}</span>
      {sync.pendingCount > 0 && (
        <span className="sync-status-badge">{sync.pendingCount}</span>
      )}
      {connectivity === "offline" && <span className="sr-only"> — connexion perdue</span>}
    </button>
  );
}
