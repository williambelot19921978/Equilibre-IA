import { getCurrentDeviceDate } from "../time/deviceClock";
import type { SpiritualScheduleOption } from "../../types/spiritual";

function roundToNextFiveMinutes(date: Date): Date {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const remainder = minutes % 5;
  if (remainder !== 0) {
    next.setMinutes(minutes + (5 - remainder), 0, 0);
  } else {
    next.setSeconds(0, 0);
  }
  return next;
}

function defaultMomentTime(preferredMoment?: string): string {
  if (preferredMoment === "morning") return "07:30";
  if (preferredMoment === "midday") return "12:30";
  if (preferredMoment === "afternoon") return "16:00";
  return "20:30";
}

export function resolveSpiritualSchedule({
  date,
  schedule,
  durationMinutes,
  customStartTime,
  preferredMoment,
  now = new Date(),
}: {
  date: string;
  schedule: SpiritualScheduleOption;
  durationMinutes: number;
  customStartTime?: string;
  preferredMoment?: string;
  now?: Date;
}): { startsAt: string; endsAt: string } {
  let start: Date;

  if (schedule === "custom" && customStartTime) {
    start = new Date(`${date}T${customStartTime}:00`);
  } else if (schedule === "now" && date === getCurrentDeviceDate()) {
    start = roundToNextFiveMinutes(now);
  } else if (schedule === "now") {
    const time = defaultMomentTime(preferredMoment);
    start = new Date(`${date}T${time}:00`);
  } else {
    throw new Error("NEXT_FREE_REQUIRES_ASYNC");
  }

  if (Number.isNaN(start.getTime())) {
    throw new Error("Heure de début invalide.");
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}
