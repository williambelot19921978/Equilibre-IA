import { Button } from "../ui/Button";
import { useAuraTheme } from "../../design-system/aura/ThemeProvider";
import type { AuraThemeMode } from "../../design-system/aura/brand";

const MODES: { id: AuraThemeMode; label: string }[] = [
  { id: "light", label: "Clair" },
  { id: "dark", label: "Sombre" },
  { id: "system", label: "Système" },
];

export function AuraThemeSettings() {
  const { mode, effective, setMode } = useAuraTheme();

  return (
    <div className="aura-theme-settings" data-testid="aura-theme-settings">
      <p className="aura-caption">
        Thème actif : <strong>{effective === "dark" ? "Sombre" : "Clair"}</strong>
        {mode === "system" ? " (automatique)" : ""}
      </p>
      <div className="aura-theme-grid" role="group" aria-label="Mode d'apparence">
        {MODES.map((item) => (
          <Button
            key={item.id}
            variant={mode === item.id ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode(item.id)}
            data-testid={`aura-theme-${item.id}`}
            aria-pressed={mode === item.id}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
