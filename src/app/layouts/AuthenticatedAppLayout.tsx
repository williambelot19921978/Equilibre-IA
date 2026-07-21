import { Outlet, useLocation } from "react-router-dom";

import { AppLayoutProvider, useAppLayout } from "../../contexts/AppLayoutContext";
import { MobileReliabilityProvider } from "../../contexts/MobileReliabilityProvider";
import { ConversationProvider } from "../../contexts/ConversationProvider";
import { AppShell } from "../../components/navigation/AppShell";
import { DemoModeBanner } from "../../components/demo/DemoModeBanner";
import { OfflineBanner } from "../../components/mobile/OfflineBanner";
import { PwaInstallPrompt } from "../../components/mobile/PwaInstallPrompt";
import { APPLICATION_ROUTE_TITLES } from "../../lib/navigation/routes";
import type { AppRoute } from "../../lib/navigation/routes";
import { appConfig } from "../../config/app";
import { resolveSpaceFromPath } from "../../design-system/spaceThemes";

function AuthenticatedAppLayoutInner() {
  const location = useLocation();
  const { title, headerActions } = useAppLayout();
  const defaultTitle =
    APPLICATION_ROUTE_TITLES[location.pathname as AppRoute] ?? appConfig.name;
  const space = resolveSpaceFromPath(location.pathname);

  return (
    <div className="authenticated-app-layout" data-space={space}>
      <DemoModeBanner />
      <OfflineBanner />
      <PwaInstallPrompt />
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
      <MobileReliabilityProvider>
        <ConversationProvider>
          <AuthenticatedAppLayoutInner />
        </ConversationProvider>
      </MobileReliabilityProvider>
    </AppLayoutProvider>
  );
}
