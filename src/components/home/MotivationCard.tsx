import { useMemo, useState } from "react";

import {
  formatCatholicDayLine,
  getCatholicDayInfo,
} from "../../content/catholicCalendar";
import { getTodayDateString } from "../../lib/navigation/urlDate";
import { pickMotivationContent } from "../../data/motivationLibrary";
import { Button } from "../ui/Button";

type MotivationCardProps = {
  faithImportance?: string;
  faithContent?: string[];
  compact?: boolean;
  showSpiritualActions?: boolean;
  showSaintCalendar?: boolean;
  onOpenSpiritualSpace?: () => void;
  onAddCalmMoment?: () => void;
};

export function MotivationCard({
  faithImportance,
  faithContent = [],
  compact = false,
  showSpiritualActions = true,
  showSaintCalendar = true,
  onOpenSpiritualSpace,
  onAddCalmMoment,
}: MotivationCardProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [spiritualToggle, setSpiritualToggle] = useState(false);
  const [saintDetailOpen, setSaintDetailOpen] = useState(false);

  const content = useMemo(
    () =>
      pickMotivationContent({
        faithImportance,
        spiritualPreferences: faithContent,
        recentIds,
        useSpiritual:
          faithImportance === "important" ||
          (faithImportance === "discreet" && spiritualToggle) ||
          (faithImportance === "when_needed" && spiritualToggle),
      }),
    [faithImportance, faithContent, recentIds, spiritualToggle],
  );

  const catholicDay = useMemo(() => {
    if (!showSaintCalendar) return null;
    return getCatholicDayInfo(getTodayDateString());
  }, [showSaintCalendar]);

  const saintLine = catholicDay ? formatCatholicDayLine(catholicDay) : "";

  function showAnother() {
    setRecentIds((current) => [...current, content.id].slice(-8));
    if (faithImportance === "discreet" || faithImportance === "when_needed") {
      setSpiritualToggle((value) => !value);
    }
  }

  return (
    <section
      className={`motivation-card${compact ? " motivation-card-compact" : ""}`}
    >
      <p className="card-label">{content.title}</p>
      {content.reference && (
        <p className="motivation-reference">{content.reference}</p>
      )}
      <p className="motivation-text">{content.text}</p>

      {saintLine && (
        <p className="motivation-saint-line">{saintLine}</p>
      )}

      {catholicDay?.shortDescription && saintDetailOpen && (
        <div className="motivation-saint-detail">
          <p>{catholicDay.shortDescription}</p>
          <p className="motivation-saint-source">
            Source : {catholicDay.source}
          </p>
        </div>
      )}

      <div className="motivation-actions">
        <Button type="button" variant="secondary" size="sm" onClick={showAnother}>
          Afficher une autre phrase
        </Button>

        {catholicDay?.shortDescription && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSaintDetailOpen((open) => !open)}
          >
            {saintDetailOpen ? "Masquer" : "En savoir plus"}
          </Button>
        )}

        {showSpiritualActions && onOpenSpiritualSpace && (
          <Button type="button" variant="secondary" size="sm" onClick={onOpenSpiritualSpace}>
            Ouvrir mon espace spirituel
          </Button>
        )}

        {showSpiritualActions && onAddCalmMoment && (
          <Button type="button" size="sm" onClick={onAddCalmMoment}>
            Ajouter un temps calme
          </Button>
        )}
      </div>
    </section>
  );
}
