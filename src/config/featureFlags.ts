function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return value === "true" || value === "1";
}

export function isGoogleCalendarEnabled(): boolean {
  return parseBooleanEnv(
    import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED,
    false,
  );
}
