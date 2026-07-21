import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { isHouseholdCollaborationEnabled } from "../config/featureFlags";
import { prepareHouseholdCollaboration } from "../lib/householdCollaboration/prepareHouseholdCollaboration";
import { getTodayDateString } from "../lib/navigation/urlDate";
import type { AppRoute } from "../lib/navigation/routes";
import type { HouseholdCollaborationProposal } from "../types/householdCollaboration";
import { useAppNavigation } from "./useAppNavigation";

function buildNavigationPath(route: AppRoute, date?: string): string {
  if (!date || date === getTodayDateString()) return route;
  return `${route}?date=${encodeURIComponent(date)}`;
}

export function useHouseholdCollaboration() {
  const navigate = useNavigate();
  const { AppRoutes } = useAppNavigation();
  const enabled = isHouseholdCollaborationEnabled();
  const [pendingProposal, setPendingProposal] =
    useState<HouseholdCollaborationProposal | null>(null);
  const [preparing, setPreparing] = useState(false);

  const openProposalConfirmation = useCallback(
    (proposal: HouseholdCollaborationProposal) => {
      if (!enabled) return;
      setPendingProposal(proposal);
    },
    [enabled],
  );

  const cancelProposal = useCallback(() => {
    if (preparing) return;
    setPendingProposal(null);
  }, [preparing]);

  const confirmProposal = useCallback(async () => {
    if (!pendingProposal || preparing) return;

    try {
      setPreparing(true);
      const result = prepareHouseholdCollaboration(pendingProposal);
      setPendingProposal(null);

      const routeMap = {
        "/tasks": AppRoutes.TASKS,
        "/planning": AppRoutes.PLANNING,
        "/goals": AppRoutes.GOALS,
      } as const;

      const targetRoute = routeMap[result.navigation.route];
      navigate(buildNavigationPath(targetRoute, result.navigation.date));
    } finally {
      setPreparing(false);
    }
  }, [pendingProposal, preparing, navigate, AppRoutes]);

  return {
    enabled,
    pendingProposal,
    preparing,
    openProposalConfirmation,
    cancelProposal,
    confirmProposal,
  };
}
