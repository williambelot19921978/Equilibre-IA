import { useState, type ReactNode } from "react";

import { AppDrawer } from "./AppDrawer";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { ConversationHeaderTrigger } from "../conversation/FloatingConversationBar";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { useSidebarPreferences } from "../../hooks/useSidebarPreferences";
import { AppRoutes } from "../../lib/navigation/routes";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
};

function UserAvatar({ name, onClick }: { name: string; onClick?: () => void }) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      className="app-header-avatar"
      aria-label="Mon profil"
      onClick={onClick}
    >
      <span aria-hidden="true">{initial}</span>
    </button>
  );
}

export function AppShell({ children, title, headerActions }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const { goToRoute } = useAppNavigation();
  const { sidebarCollapsed, toggleCollapsed, saving: sidebarSaving } =
    useSidebarPreferences(user?.id);

  const displayName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Utilisateur";

  return (
    <div
      className={
        sidebarCollapsed
          ? "app-shell-sidebar-collapsed"
          : "app-shell-sidebar-expanded"
      }
    >
      <header className="app-header-fixed">
        <div className="app-header-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="app-header-menu-btn"
            aria-label="Réglages avancés"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </Button>

          <div className="app-header-brand">
            <span className="app-header-logo" aria-hidden="true">
              ◎
            </span>
            <span className="app-header-brand-name">Équilibre IA</span>
          </div>
        </div>

        {title && <h1 className="app-header-title">{title}</h1>}

        <div className="app-header-end">
          {headerActions}

          <ConversationHeaderTrigger />

          <button
            type="button"
            className="app-header-notifications"
            aria-label="Notifications (bientôt disponible)"
            disabled
            title="Notifications — bientôt disponible"
          >
            🔔
          </button>

          <UserAvatar
            name={displayName}
            onClick={() => goToRoute(AppRoutes.USER_PROFILE)}
          />
        </div>
      </header>

      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => void toggleCollapsed()}
        toggling={sidebarSaving}
      />

      <main className="app-main-content">{children}</main>

      <BottomNav />

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
