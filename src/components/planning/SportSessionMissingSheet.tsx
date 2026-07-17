import { BlockActionButton } from "./BlockActionButton";
import { Button } from "../ui/Button";

type SportSessionMissingSheetProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onGenerate: () => void;
  onChooseAnother: () => void;
  onClose: () => void;
};

export function SportSessionMissingSheet({
  title,
  message = "Aucune séance n'est associée à cette activité sportive.",
  loading = false,
  onGenerate,
  onChooseAnother,
  onClose,
}: SportSessionMissingSheetProps) {
  return (
    <div className="workout-player-overlay" role="dialog" aria-label="Séance sportive">
      <div className="workout-player sport-session-missing-sheet">
        <header className="workout-player-header">
          <div>
            <p className="card-label">Activité sportive</p>
            <h2>{title}</h2>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </header>
        <p>{message}</p>
        <div className="workout-player-actions">
          <BlockActionButton
            icon="✨"
            label="Générer une séance"
            tone="primary"
            onClick={onGenerate}
            disabled={loading}
          />
          <BlockActionButton
            icon="↻"
            label="Choisir une autre séance"
            onClick={onChooseAnother}
            disabled={loading}
          />
          <BlockActionButton icon="✕" label="Annuler" tone="ghost" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
