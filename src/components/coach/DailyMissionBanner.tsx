import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";
import { loadLivingMemory } from "../../services/livingMemoryService";
import type { DailyMission } from "../../types/livingMemory";

export function DailyMissionBanner({
  lifeContext = null,
}: {
  lifeContext?: import("../../types/lifeContext").LifeContext | null;
}) {
  const { user } = useAuth();
  const [mission, setMission] = useState<DailyMission | null>(null);

  useEffect(() => {
    if (!user) return;

    void loadLivingMemory({
      userId: user.id,
      referenceDate: getCurrentDeviceDate(),
      lifeContext,
    })
      .then((memory) => setMission(memory.dailyMission))
      .catch(() => setMission(null));
  }, [user, lifeContext]);

  if (!mission) return null;

  return (
    <section className="daily-mission-banner" aria-label="Mission du jour">
      <div>
        <p className="daily-mission-label">{mission.title}</p>
        <p className="daily-mission-description">{mission.description}</p>
        <p className="daily-mission-reasoning">{mission.reasoning}</p>
      </div>
      <Link to="/my-ai" className="daily-mission-link">
        Mon IA
      </Link>
    </section>
  );
}
