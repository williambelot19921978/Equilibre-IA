import { Button } from "../ui/Button";

type StudySlotRecommendationCardProps = {
  message: string;
  accepting?: boolean;
  onStart: () => void;
  onLater: () => void;
  onDismiss: () => void;
};

export function StudySlotRecommendationCard({
  message,
  accepting = false,
  onStart,
  onLater,
  onDismiss,
}: StudySlotRecommendationCardProps) {
  const paragraphs = message.split("\n\n").filter(Boolean);

  return (
    <section
      className="study-slot-recommendation-card"
      aria-live="polite"
      aria-label="Recommandation d'étude"
    >
      <p className="study-slot-recommendation-label">Suggestion du moment</p>
      <div className="study-slot-recommendation-copy">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="study-slot-recommendation-actions">
        <Button fullWidth loading={accepting} onClick={onStart}>
          Commencer
        </Button>
        <Button variant="secondary" fullWidth disabled={accepting} onClick={onLater}>
          Plus tard
        </Button>
        <Button variant="ghost" fullWidth disabled={accepting} onClick={onDismiss}>
          Ignorer
        </Button>
      </div>
    </section>
  );
}
