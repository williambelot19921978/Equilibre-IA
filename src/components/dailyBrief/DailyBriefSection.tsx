import { useState } from "react";

import { Button } from "../ui/Button";
import type { DailyBrief } from "../../lib/dailyBrief/buildDailyBrief";
import type { PresentedDailyBriefRecommendation } from "../../lib/explainability/presentDailyBrief";
import { DailyBriefContent } from "./DailyBriefContent";

type DailyBriefSectionProps = {
  brief: DailyBrief;
  presentedRecommendations: PresentedDailyBriefRecommendation[];
  updateHint?: string | null;
  onRecommendationAction?: (
    recommendation: PresentedDailyBriefRecommendation,
  ) => void;
};

export function DailyBriefSection({
  brief,
  presentedRecommendations,
  updateHint = null,
  onRecommendationAction,
}: DailyBriefSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="daily-brief-section" aria-label="Daily Brief">
      <header className="daily-brief-section-header">
        <div>
          <p className="daily-brief-section-label">Daily Brief</p>
          <p className="daily-brief-section-subtitle">{brief.synthesis}</p>
          {updateHint && (
            <p className="daily-brief-update-hint">{updateHint}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Réduire" : "Ouvrir"}
        </Button>
      </header>

      {expanded && (
        <DailyBriefContent
          brief={brief}
          presentedRecommendations={presentedRecommendations}
          onRecommendationAction={onRecommendationAction}
        />
      )}
    </section>
  );
}
