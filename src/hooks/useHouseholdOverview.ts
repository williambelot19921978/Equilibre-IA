import { useCallback, useEffect, useState } from "react";

import { isHouseholdOverviewEnabled } from "../config/featureFlags";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { loadHouseholdOverviewBundle } from "../services/householdOverviewService";
import type { HouseholdOverview } from "../types/householdOverview";
import type { PresentedHouseholdOpportunityWithCollaboration } from "../types/householdCollaboration";

export function useHouseholdOverview(userId: string | undefined) {
  const enabled = isHouseholdOverviewEnabled();
  const [selectedDate, setSelectedDate] = useState(getCurrentDeviceDate());
  const [overview, setOverview] = useState<HouseholdOverview | null>(null);
  const [opportunities, setOpportunities] = useState<
    PresentedHouseholdOpportunityWithCollaboration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId || !enabled) {
      setOverview(null);
      setOpportunities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const loaded = await loadHouseholdOverviewBundle(userId, selectedDate);
      setOverview(loaded?.overview ?? null);
      setOpportunities(loaded?.opportunities ?? []);
      if (!loaded) {
        setError("Impossible de construire la vue foyer.");
      }
    } catch (loadError) {
      setOverview(null);
      setOpportunities([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger la vue foyer.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, selectedDate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    enabled,
    selectedDate,
    setSelectedDate,
    overview,
    opportunities,
    loading,
    error,
    reload,
  };
}
