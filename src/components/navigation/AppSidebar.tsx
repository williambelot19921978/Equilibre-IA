import { useCallback } from "react";
import { useLocation } from "react-router-dom";

import { getDesktopSidebarItems } from "../../lib/navigation/appNavigationItems";
import type { AppRoute } from "../../lib/navigation/routes";
import { AppRoutes } from "../../lib/navigation/routes";
import { useAppNavigation } from "../../hooks/useAppNavigation";

function isRouteActive(pathname: string, route: string): boolean {
  if (route === AppRoutes.HOME) {
    return pathname === AppRoutes.HOME || pathname.startsWith(`${AppRoutes.HOME}?`);
  }
  return pathname === route || pathname.startsWith(`${route}?`);
}

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function AppSidebar({
  collapsed,
  onToggle,
}: AppSidebarProps) {
  const location = useLocation();
  const { goToRoute } = useAppNavigation();

  const handleNavigate = useCallback(
    (route: AppRoute) => {
      goToRoute(route);
    },
    [goToRoute],
  );

  const navItems = getDesktopSidebarItems();

  return (
    <aside
      className={[
        "app-sidebar",
        collapsed ? "app-sidebar-collapsed" : "app-sidebar-expanded",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Navigation principale"
      data-collapsed={collapsed}
    >
      <button
        type="button"
        className="app-sidebar-toggle"
        aria-label={collapsed ? "Déplier la navigation" : "Replier la navigation"}
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
        <span className="app-sidebar-toggle-label">
          {collapsed ? "Déplier" : "Replier"}
        </span>
      </button>

      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const active = isRouteActive(location.pathname, item.route);
          return (
            <button
              key={item.id}
              type="button"
              className={[
                "app-nav-item",
                active ? "app-nav-item-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-space={item.space}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              onClick={() => handleNavigate(item.route)}
            >
              <span className="app-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="app-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="app-sidebar-footer">
        <p className="app-sidebar-tagline">Aura</p>
        <p className="app-sidebar-version">Version bêta</p>
      </div>
    </aside>
  );
}
