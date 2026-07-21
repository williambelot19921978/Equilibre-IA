import { Button } from "../ui/Button";
import type { DailyBrief } from "../../lib/dailyBrief/buildDailyBrief";
import type { PresentedDailyBriefRecommendation } from "../../lib/explainability/presentDailyBrief";
import { DailyBriefContent } from "./DailyBriefContent";

type DailyBriefModalProps = {
  brief: DailyBrief;
  presentedRecommendations: PresentedDailyBriefRecommendation[];
  updateHint?: string | null;
  onClose: () => void;
  onRecommendationAction?: (
    recommendation: PresentedDailyBriefRecommendation,
  ) => void;
};

export function DailyBriefModal({
  brief,
  presentedRecommendations,
  updateHint = null,
  onClose,
  onRecommendationAction,
}: DailyBriefModalProps) {
  return (
    <div className="daily-brief-modal-backdrop" role="presentation">
      <section
        className="daily-brief-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-brief-title"
        aria-live="polite"
      >
        <header className="daily-brief-modal-header">
          <div>
            <p id="daily-brief-title" className="daily-brief-modal-label">
              Daily Brief
            </p>
            {updateHint && (
              <p className="daily-brief-update-hint">{updateHint}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <DailyBriefContent
          brief={brief}
          presentedRecommendations={presentedRecommendations}
          onRecommendationAction={onRecommendationAction}
        />

        <Button fullWidth onClick={onClose}>
          Compris
        </Button>
      </section>
    </div>
  );
}
