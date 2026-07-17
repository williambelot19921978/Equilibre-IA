import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";
import { generateProactiveCoachMessage } from "../../ai/coach/proactiveCoachEngine";
import { generateWeeklyReview, isWeeklyReviewDay } from "../../ai/reasoning/weeklyReviewEngine";
import { loadStatisticsForPeriod } from "../../services/statisticsService";
import { loadHabitProfile } from "../../services/habitProfileService";
import { loadLivingMemory } from "../../services/livingMemoryService";
import type { ProactiveCoachMessage } from "../../ai/coach/proactiveCoachEngine";

type ProactiveCoachBannerProps = {
  firstName: string;
  lifeContext?: import("../../types/lifeContext").LifeContext | null;
};

export function ProactiveCoachBanner({
  firstName,
  lifeContext = null,
}: ProactiveCoachBannerProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState<ProactiveCoachMessage | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;

    async function loadMessage() {
      if (!user) return;
      const referenceDate = getCurrentDeviceDate();
      const hour = new Date().getHours();
      const [habitProfile, stats, livingMemory] = await Promise.all([
        loadHabitProfile(user.id).catch(() => null),
        loadStatisticsForPeriod({
          userId: user.id,
          referenceDate,
          period: "week",
        }).catch(() => null),
        loadLivingMemory({
          userId: user.id,
          referenceDate,
          lifeContext,
        }).catch(() => null),
      ]);

      const weeklyReview =
        stats && isWeeklyReviewDay(referenceDate)
          ? generateWeeklyReview(stats)
          : null;

      const proactive = generateProactiveCoachMessage({
        firstName,
        referenceDate,
        hour,
        lifeContext,
        habitProfile,
        livingMemory,
        weeklyReview,
      });

      setMessage(proactive);
    }

    void loadMessage();
  }, [user, firstName, lifeContext, dismissed]);

  if (!message || dismissed) return null;

  return (
    <section className="proactive-coach-banner" aria-live="polite">
      <div>
        <p className="proactive-coach-greeting">{message.greeting}</p>
        <p>{message.body}</p>
        {message.suggestion && (
          <p className="proactive-coach-suggestion">{message.suggestion}</p>
        )}
      </div>
      <button
        type="button"
        className="proactive-coach-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Fermer"
      >
        ×
      </button>
    </section>
  );
}
