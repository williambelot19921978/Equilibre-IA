import type { ReactNode } from "react";
import { AuthProvider } from "../../contexts/AuthProvider";
import { SidebarPreferencesProvider } from "../../contexts/SidebarPreferencesProvider";
import { UserProgressProvider } from "../../contexts/UserProgressProvider";
import { WorkoutPlayerProvider } from "../../contexts/WorkoutPlayerContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <UserProgressProvider>
        <SidebarPreferencesProvider>
          <WorkoutPlayerProvider>{children}</WorkoutPlayerProvider>
        </SidebarPreferencesProvider>
      </UserProgressProvider>
    </AuthProvider>
  );
}
