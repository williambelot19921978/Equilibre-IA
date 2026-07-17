import { getCurrentDeviceDate, addDaysToDate } from "../../lib/time/deviceClock";
import { Button } from "../ui/Button";

type DayNavigationBarProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function DayNavigationBar({
  selectedDate,
  onDateChange,
}: DayNavigationBarProps) {
  const today = getCurrentDeviceDate();

  return (
    <div className="day-navigation-bar">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Jour précédent"
        onClick={() => onDateChange(addDaysToDate(selectedDate, -1))}
      >
        ← Jour précédent
      </Button>

      <Button
        type="button"
        variant={selectedDate === today ? "primary" : "secondary"}
        size="sm"
        onClick={() => onDateChange(today)}
      >
        Aujourd’hui
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Jour suivant"
        onClick={() => onDateChange(addDaysToDate(selectedDate, 1))}
      >
        Jour suivant →
      </Button>
    </div>
  );
}
