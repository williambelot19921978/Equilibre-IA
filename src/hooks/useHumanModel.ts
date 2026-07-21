import { useCallback, useEffect, useState } from "react";

import {
  buildAssistantContext,
  defaultContextEngineDependencies,
} from "../ai/conversationFoundation";
import { buildHumanModel, type HumanModel } from "../ai/humanModelFoundation";
import { isHumanModelEnabled } from "../config/featureFlags";

export function useHumanModel(
  userId: string | undefined,
  firstName: string,
) {
  const enabled = isHumanModelEnabled() && Boolean(userId);
  const [humanModel, setHumanModel] = useState<HumanModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !userId) {
      setHumanModel(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const context = await buildAssistantContext(
        { userId, firstName },
        defaultContextEngineDependencies,
      );
      setHumanModel(buildHumanModel(context));
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Impossible de charger le profil IA.";
      setError(message);
      setHumanModel(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, firstName, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    enabled,
    humanModel,
    loading,
    error,
    refresh,
  };
}
