import {
  AppRoutes,
  APPLICATION_ROUTES,
  isApplicationRoute,
  isOnboardingRoute,
} from "./routes";

export type ConversationBarVisibilityInput = {
  isAuthenticated: boolean;
  pathname: string;
  progressLoading: boolean;
};

export function shouldShowConversationBar({
  isAuthenticated,
  pathname,
  progressLoading,
}: ConversationBarVisibilityInput): boolean {
  if (!isAuthenticated) {
    return false;
  }

  if (isOnboardingRoute(pathname)) {
    return false;
  }

  if (pathname === AppRoutes.LOGIN || pathname === AppRoutes.SIGNUP) {
    return false;
  }

  if (progressLoading) {
    return true;
  }

  return isApplicationRoute(pathname);
}

export function getConversationBarDebugInfo(
  input: ConversationBarVisibilityInput & {
    conversationAvailable: boolean;
    rendered: boolean;
    status: string;
  },
): Record<string, string | boolean> {
  return {
    user: input.isAuthenticated,
    progressLoading: input.progressLoading,
    canShow: shouldShowConversationBar(input),
    conversation: input.conversationAvailable,
    pathname: input.pathname,
    status: input.status,
    rendered: input.rendered,
  };
}

export { APPLICATION_ROUTES, isApplicationRoute, isOnboardingRoute };
