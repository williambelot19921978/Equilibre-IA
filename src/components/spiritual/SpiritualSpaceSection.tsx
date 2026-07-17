import { useMemo, useState } from "react";

import { pickSpiritualContent } from "../../data/spiritualContentLibrary";
import { Button } from "../ui/Button";

type SpiritualSpaceSectionProps = {
  faithImportance?: string;
  faithContent?: string[];
  onAddToFreeTime?: (content: ReturnType<typeof pickSpiritualContent>) => void;
  compact?: boolean;
};

export function SpiritualSpaceSection({
  faithImportance,
  faithContent = [],
  onAddToFreeTime,
  compact = false,
}: SpiritualSpaceSectionProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const content = useMemo(
    () =>
      pickSpiritualContent({
        preferences: faithContent,
        recentIds,
      }),
    [faithContent, recentIds],
  );

  if (!faithImportance || faithImportance === "disabled") {
    return null;
  }

  function showAnother() {
    setRecentIds((current) => [...current, content.id]);
  }

  return (
    <section className={`spiritual-space${compact ? " spiritual-space-compact" : ""}`}>
      <div className="section-heading">
        <div>
          <p className="card-label">Spiritualité</p>
          <h2>Mon espace spirituel</h2>
        </div>
      </div>

      <article className="spiritual-card">
        <p className="spiritual-reference">{content.reference}</p>
        <p>{content.text}</p>

        <div className="spiritual-actions">
          <Button variant="secondary" size="sm" onClick={showAnother}>
            Afficher une autre proposition
          </Button>
          {onAddToFreeTime && (
            <Button size="sm" onClick={() => onAddToFreeTime(content)}>
              Ajouter à mon temps libre
            </Button>
          )}
        </div>

        <p className="spiritual-hint">
          Proposition facultative — jamais imposée.
        </p>
      </article>
    </section>
  );
}
