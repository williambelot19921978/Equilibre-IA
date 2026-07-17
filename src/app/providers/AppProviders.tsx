import type { ReactNode } from "react";
import { AuthProvider } from "../../contexts/AuthProvider";
import { UserProgressProvider } from "../../contexts/UserProgressProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <UserProgressProvider>{children}</UserProgressProvider>
    </AuthProvider>
  );
}
