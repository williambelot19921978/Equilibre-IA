import { CALENDAR_COLORS } from "../../config/calendarColors";
import type { MonthEventBarSegment } from "../../lib/planning/monthEventLayout";

type MonthEventBarProps = {
  segment: MonthEventBarSegment;
  onClick?: (segment: MonthEventBarSegment) => void;
};

export function MonthEventBar({ segment, onClick }: MonthEventBarProps) {
  const colors = CALENDAR_COLORS[segment.colorCategory];
  const span = segment.endCol - segment.startCol + 1;

  return (
    <button
      type="button"
      className={[
        "month-event-bar",
        segment.isSegmentStart ? "month-event-bar-start" : "",
        segment.isSegmentEnd ? "month-event-bar-end" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        gridColumn: `${segment.startCol + 1} / span ${span}`,
        gridRow: segment.lane + 2,
        background: colors.background,
        color: colors.text,
        borderColor: colors.border,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(segment);
      }}
      title={segment.title}
    >
      {segment.isSegmentStart ? segment.title : "\u00a0"}
    </button>
  );
}
