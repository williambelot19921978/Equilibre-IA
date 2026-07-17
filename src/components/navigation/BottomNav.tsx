import { useCallback } from "react";
import { useLocation } from "react-router-dom";

import { getMobileBottomNavItems } from "../../lib/navigation/appNavigationItems";
import type { AppRoute } from "../../lib/navigation/routes";
import { AppRoutes } from "../../lib/navigation/routes";
import { useAppNavigation } from "../../hooks/useAppNavigation";

function isRouteActive(pathname: string, route: string): boolean {
  if (route === AppRoutes.HOME) {
    return pathname === AppRoutes.HOME || pathname.startsWith(`${AppRoutes.HOME}?`);
  }
  return pathname === route || pathname.startsWith(`${route}?`);
}

export function BottomNav() {
  const location = useLocation();
  const { goToRoute } = useAppNavigation();
  const navItems = getMobileBottomNavItems();

  const handleNavigate = useCallback(
    (route: AppRoute) => {
      goToRoute(route);
    },
    [goToRoute],
  );

  return (
    <nav className="app-bottom-nav" aria-label="Navigation mobile">
      {navItems.map((item) => {
        const active = isRouteActive(location.pathname, item.route);
        return (
          <button
            key={item.id}
            type="button"
            className={[
              "app-bottom-nav-item",
              active ? "app-bottom-nav-item-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-space={item.space}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            onClick={() => handleNavigate(item.route)}
          >
            <span className="app-bottom-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="app-bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
