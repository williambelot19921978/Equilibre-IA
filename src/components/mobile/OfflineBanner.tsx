import { useMobileReliability } from "../../contexts/MobileReliabilityProvider";
import { Button } from "../ui/Button";

export function OfflineBanner() {
  const { connectivity, refreshSync } = useMobileReliability();

  if (connectivity !== "offline") return null;

  return (
    <aside className="offline-banner" role="status" aria-live="polite" data-testid="offline-banner">
      <div>
        <strong>Vous êtes hors ligne</strong>
        <p>Vos modifications sont enregistrées localement et seront synchronisées au retour de la connexion.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={refreshSync}>
        Réessayer
      </Button>
    </aside>
  );
}
