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

  // Keep offline indicator visible even if sync snapshot briefly clears (e.g. auth refresh).
  if (!sync && connectivity !== "offline") return null;

  const status = sync?.status ?? "offline";
  const label = STATUS_LABELS[status];

  return (
    <button
      type="button"
      className={`sync-status-indicator sync-status-${status}`}
      onClick={refreshSync}
      aria-live="polite"
      data-testid="sync-status-indicator"
      title={
        sync?.lastSyncedAt
          ? `Dernière sync : ${new Date(sync.lastSyncedAt).toLocaleString("fr-FR")}`
          : label
      }
    >
      <span className="sync-status-dot" aria-hidden="true" />
      <span>{label}</span>
      {(sync?.pendingCount ?? 0) > 0 && (
        <span className="sync-status-badge">{sync?.pendingCount}</span>
      )}
      {connectivity === "offline" && <span className="sr-only"> — connexion perdue</span>}
    </button>
  );
}
