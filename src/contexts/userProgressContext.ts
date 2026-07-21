import { createContext } from "react";
import type { AppRoute } from "../lib/navigation/routes";
import type { UserProgressState } from "../lib/navigation/types";

export type UserProgressContextValue = {
  progress: UserProgressState;
  resolvedRoute: AppRoute;
  loading: boolean;
  progressError: string | null;
  refreshProgress: () => Promise<UserProgressState>;
  isCurrentRouteAllowed: (pathname: string) => boolean;
};

export const UserProgressContext = createContext<
  UserProgressContextValue | undefined
>(undefined);
