import type {
  ExternalEventType,
  GoogleCalendarEventPayload,
} from "../../types/googleCalendar";

export function classifyGoogleEvent(
  event: GoogleCalendarEventPayload,
  calendarName = "",
): ExternalEventType {
  const summary = (event.summary ?? "").toLowerCase();
  const calendarLower = calendarName.toLowerCase();

  if (
    event.eventType === "birthday" ||
    calendarLower.includes("birthday") ||
    calendarLower.includes("anniversaire") ||
    summary.includes("anniversaire") ||
    summary.includes("birthday")
  ) {
    return "birthday";
  }

  if (
    summary.includes("vacances") ||
    summary.includes("vacation") ||
    summary.includes("congé") ||
    summary.includes("conges")
  ) {
    return "vacation";
  }

  if (
    summary.includes("travail") ||
    summary.includes("work") ||
    calendarLower.includes("work") ||
    calendarLower.includes("travail")
  ) {
    return "work";
  }

  if (
    summary.includes("famille") ||
    summary.includes("family") ||
    calendarLower.includes("family")
  ) {
    return "family";
  }

  if (event.start?.dateTime || event.start?.date) {
    return "appointment";
  }

  return "other";
}
