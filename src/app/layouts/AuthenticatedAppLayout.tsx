import { Outlet, useLocation } from "react-router-dom";

import { AppLayoutProvider, useAppLayout } from "../../contexts/AppLayoutContext";
import { ConversationProvider } from "../../contexts/ConversationProvider";
import { WorkoutPlayerProvider } from "../../contexts/WorkoutPlayerContext";
import { AppShell } from "../../components/navigation/AppShell";
import { APPLICATION_ROUTE_TITLES } from "../../lib/navigation/routes";
import type { AppRoute } from "../../lib/navigation/routes";
import { resolveSpaceFromPath } from "../../design-system/spaceThemes";

function AuthenticatedAppLayoutInner() {
  const location = useLocation();
  const { title, headerActions } = useAppLayout();
  const defaultTitle =
    APPLICATION_ROUTE_TITLES[location.pathname as AppRoute] ?? "Équilibre IA";
  const space = resolveSpaceFromPath(location.pathname);

  return (
    <div className="authenticated-app-layout" data-space={space}>
      <AppShell title={title ?? defaultTitle} headerActions={headerActions}>
        <div className="authenticated-app-content">
          <Outlet />
        </div>
      </AppShell>
    </div>
  );
}

export function AuthenticatedAppLayout() {
  return (
    <AppLayoutProvider>
      <ConversationProvider>
        <WorkoutPlayerProvider>
          <AuthenticatedAppLayoutInner />
        </WorkoutPlayerProvider>
      </ConversationProvider>
    </AppLayoutProvider>
  );
}
