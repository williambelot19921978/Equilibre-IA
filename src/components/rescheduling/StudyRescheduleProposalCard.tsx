import { Button } from "../ui/Button";

type StudyRescheduleProposalCardProps = {
  message: string;
  moving?: boolean;
  onMove: () => void;
  onKeep: () => void;
  onDismiss: () => void;
};

export function StudyRescheduleProposalCard({
  message,
  moving = false,
  onMove,
  onKeep,
  onDismiss,
}: StudyRescheduleProposalCardProps) {
  const paragraphs = message.split("\n").filter((line) => line.trim().length > 0);

  return (
    <section
      className="study-reschedule-proposal-card"
      aria-live="polite"
      aria-label="Proposition de déplacement"
    >
      <p className="study-reschedule-proposal-label">Réorganisation proposée</p>
      <div className="study-reschedule-proposal-copy">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="study-reschedule-proposal-actions">
        <Button fullWidth loading={moving} onClick={onMove}>
          Déplacer
        </Button>
        <Button variant="secondary" fullWidth disabled={moving} onClick={onKeep}>
          Garder l'horaire actuel
        </Button>
        <Button variant="ghost" fullWidth disabled={moving} onClick={onDismiss}>
          Ignorer
        </Button>
      </div>
    </section>
  );
}

type StudyRescheduleInfoCardProps = {
  message: string;
  onClose: () => void;
};

export function StudyRescheduleInfoCard({
  message,
  onClose,
}: StudyRescheduleInfoCardProps) {
  const paragraphs = message.split("\n").filter((line) => line.trim().length > 0);

  return (
    <section className="study-reschedule-info-card" aria-live="polite">
      <div className="study-reschedule-proposal-copy">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Button variant="secondary" fullWidth onClick={onClose}>
        OK
      </Button>
    </section>
  );
}
