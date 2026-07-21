import { disableDemoMode, isDemoModeActive } from "../../demo/demoMode";
import { Button } from "../ui/Button";

export function DemoModeBanner() {
  if (!isDemoModeActive()) return null;

  return (
    <aside
      className="demo-mode-banner ds-animate-in"
      role="status"
      aria-live="polite"
      data-testid="demo-mode-banner"
    >
      <div>
        <strong>Mode démonstration</strong>
        <p>Données fictives pour explorer l&apos;application. Quittez quand vous voulez.</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          disableDemoMode();
          window.location.href = "/home";
        }}
      >
        Quitter la démo
      </Button>
    </aside>
  );
}
