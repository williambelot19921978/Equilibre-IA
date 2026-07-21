import type { ReactNode } from "react";
import { AuthProvider } from "../../contexts/AuthProvider";
import { SidebarPreferencesProvider } from "../../contexts/SidebarPreferencesProvider";
import { UserProgressProvider } from "../../contexts/UserProgressProvider";
import { WorkoutPlayerProvider } from "../../contexts/WorkoutPlayerContext";
import { AuraThemeProvider } from "../../design-system/aura/ThemeProvider";
import { AuraInsightsProvider } from "../../auraInsights/AuraInsightsProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuraThemeProvider>
      <AuthProvider>
        <AuraInsightsProvider>
          <UserProgressProvider>
            <SidebarPreferencesProvider>
              <WorkoutPlayerProvider>{children}</WorkoutPlayerProvider>
            </SidebarPreferencesProvider>
          </UserProgressProvider>
        </AuraInsightsProvider>
      </AuthProvider>
    </AuraThemeProvider>
  );
}
