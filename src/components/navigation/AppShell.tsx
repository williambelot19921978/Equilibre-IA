import { useState, type ReactNode } from "react";

import { AppDrawer } from "./AppDrawer";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { ConversationHeaderTrigger } from "../conversation/FloatingConversationBar";
import { UserMenu } from "./UserMenu";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useSidebarPreferences } from "../../hooks/useSidebarPreferences";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
};

export function AppShell({ children, title, headerActions }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const { sidebarCollapsed, toggleCollapsed } = useSidebarPreferences();

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

          <UserMenu displayName={displayName} />
        </div>
      </header>

      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleCollapsed}
      />

      <main className="app-main-content">{children}</main>

      <BottomNav />

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
