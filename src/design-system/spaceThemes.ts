import { AppRoutes, type AppRoute } from "../lib/navigation/routes";
import { getDesktopSidebarItems } from "../lib/navigation/appNavigationItems";

export type SpaceId =
  | "home"
  | "planning"
  | "calendar"
  | "spiritual"
  | "leisure"
  | "profile"
  | "family"
  | "tasks"
  | "daily-routine"
  | "statistics"
  | "my-ai";

export function resolveSpaceFromPath(pathname: string): SpaceId {
  if (pathname.startsWith(AppRoutes.HOME)) return "home";
  if (pathname.startsWith(AppRoutes.PLANNING)) return "planning";
  if (pathname.startsWith(AppRoutes.CALENDAR)) return "calendar";
  if (pathname.startsWith(AppRoutes.SPIRITUAL)) return "spiritual";
  if (pathname.startsWith(AppRoutes.LEISURE)) return "leisure";
  if (pathname.startsWith(AppRoutes.USER_PROFILE)) return "profile";
  if (pathname.startsWith(AppRoutes.FAMILY_CONTEXT)) return "family";
  if (pathname.startsWith(AppRoutes.TASKS)) return "tasks";
  if (pathname.startsWith(AppRoutes.DAILY_ROUTINE)) return "daily-routine";
  if (pathname.startsWith(AppRoutes.STATISTICS)) return "statistics";
  if (pathname.startsWith(AppRoutes.MY_AI)) return "my-ai";
  return "home";
}

export type PrimaryNavItem = {
  label: string;
  route: AppRoute;
  icon: string;
  space: SpaceId;
};

export {
  getDesktopSidebarItems as getPrimaryNavItems,
  getMobileBottomNavItems,
  type AppNavigationItem,
} from "../lib/navigation/appNavigationItems";

/** @deprecated Utiliser getDesktopSidebarItems depuis appNavigationItems */
export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = getDesktopSidebarItems().map(
  (item) => ({
    label: item.label,
    route: item.route,
    icon: item.icon,
    space: item.space,
  }),
);
