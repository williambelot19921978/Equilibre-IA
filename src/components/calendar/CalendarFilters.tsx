import { CALENDAR_FILTERS, type CalendarFilterId } from "../../config/calendarFilters";
import { isGoogleCalendarEnabled } from "../../config/featureFlags";
import { Button } from "../ui/Button";

type CalendarFiltersProps = {
  activeFilter: CalendarFilterId;
  onFilterChange: (filter: CalendarFilterId) => void;
};

export function CalendarFilters({
  activeFilter,
  onFilterChange,
}: CalendarFiltersProps) {
  const filters = CALENDAR_FILTERS.filter(
    (filter) => filter.id !== "google" || isGoogleCalendarEnabled(),
  );

  return (
    <div className="calendar-filters" role="toolbar" aria-label="Filtres calendrier">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          type="button"
          size="sm"
          variant={activeFilter === filter.id ? "primary" : "secondary"}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
