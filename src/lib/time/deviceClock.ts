/** Horloge locale de l'appareil — jamais de fuseau fixe en dur. */

export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCurrentDeviceDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function getCurrentDeviceTime(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function isToday(date: string): boolean {
  return date === getCurrentDeviceDate();
}

export function isPastDate(date: string): boolean {
  return date < getCurrentDeviceDate();
}

export function isFutureDate(date: string): boolean {
  return date > getCurrentDeviceDate();
}

export function isPast(dateTime: string | Date): boolean {
  const value = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return value.getTime() < Date.now();
}

export function isFuture(dateTime: string | Date): boolean {
  const value = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return value.getTime() > Date.now();
}

export function formatDeviceTime(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: getDeviceTimeZone(),
  }).format(new Date(iso));
}

export function formatDeviceDateLabel(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: getDeviceTimeZone(),
  }).format(new Date(`${date}T12:00:00`));
}

export function addDaysToDate(date: string, delta: number): string {
  const cursor = new Date(`${date}T12:00:00`);
  cursor.setDate(cursor.getDate() + delta);
  return `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
}
