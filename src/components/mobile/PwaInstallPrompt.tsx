import { useEffect, useState } from "react";

import { Button } from "../ui/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <aside className="pwa-install-prompt ds-animate-in" data-testid="pwa-install-prompt">
      <div>
        <strong>Installer Aura</strong>
        <p>Ajoutez l&apos;application à votre écran d&apos;accueil pour une expérience mobile optimale.</p>
      </div>
      <div className="pwa-install-actions">
        <Button
          size="sm"
          onClick={() => {
            void deferred.prompt();
            setDismissed(true);
          }}
        >
          Installer
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Plus tard
        </Button>
      </div>
    </aside>
  );
}
