import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getTodayDateString,
  resolveSelectedDate,
} from "../lib/navigation/urlDate";

export function useUrlDate() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDate = useMemo(
    () => resolveSelectedDate(searchParams.get("date")),
    [searchParams],
  );

  const setSelectedDate = useCallback(
    (date: string) => {
      if (date === selectedDate) return;

      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          if (date === getTodayDateString()) {
            next.delete("date");
          } else {
            next.set("date", date);
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, selectedDate],
  );

  return { selectedDate, setSelectedDate };
}
