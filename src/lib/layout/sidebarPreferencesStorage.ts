const STORAGE_PREFIX = "equilibre-sidebar-collapsed:";

export function readSidebarCollapsedFromStorage(
  userId: string,
): boolean | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  } catch {
    return null;
  }
}

export function writeSidebarCollapsedToStorage(
  userId: string,
  collapsed: boolean,
): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, String(collapsed));
  } catch {
    // localStorage indisponible (navigation privée, quota)
  }
}

export function clearSidebarCollapsedFromStorage(userId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch {
    // ignore
  }
}
