import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getDrawerSections } from "../../lib/navigation/appNavigationItems";
import { AppRoutes, type AppRoute } from "../../lib/navigation/routes";
import { APP_VERSION } from "../../config/appVersion";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { DrawerCalendarSection } from "./DrawerCalendarSection";

type AppDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function isRouteActive(pathname: string, route: string): boolean {
  if (route === AppRoutes.HOME) {
    return pathname === AppRoutes.HOME || pathname.startsWith(`${AppRoutes.HOME}?`);
  }

  return pathname === route || pathname.startsWith(`${route}?`);
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const location = useLocation();
  const { goToRoute } = useAppNavigation();
  const { signOut } = useAuth();

  const handleNavigate = useCallback(
    (route: AppRoute) => {
      goToRoute(route);
      onClose();
    },
    [goToRoute, onClose],
  );

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const drawerSections = getDrawerSections();

  return (
    <>
      <div
        className={`app-drawer-overlay${open ? " app-drawer-overlay-open" : ""}`}
        aria-hidden={!open}
        hidden={!open}
        onClick={onClose}
      />
      <aside
        className={`app-drawer${open ? " app-drawer-open" : ""}`}
        aria-label="Menu avancé"
        aria-hidden={!open}
        hidden={!open}
      >
        <header className="app-drawer-header">
          <h2>Menu</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <DrawerCalendarSection onClose={onClose} />

        <nav className="app-drawer-nav">
          {drawerSections.map((section) => (
            <section key={section.title} className="app-drawer-section">
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => {
                  const active = isRouteActive(location.pathname, item.route);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={[
                          "app-drawer-link",
                          active ? "app-drawer-link-active" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-current={active ? "page" : undefined}
                        onClick={() => handleNavigate(item.route)}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <footer className="app-drawer-footer">
          <p className="app-drawer-version">Équilibre IA — {APP_VERSION}</p>
          <Button variant="ghost" fullWidth onClick={() => void signOut()}>
            Se déconnecter
          </Button>
        </footer>
      </aside>
    </>
  );
}
