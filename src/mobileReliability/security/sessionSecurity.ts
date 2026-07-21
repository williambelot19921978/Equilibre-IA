/**
 * EPIC 7B — Session security helpers.
 */

import { clearInsightEventsForUser } from "../../auraInsights/eventStore";
import { supabase } from "../../lib/supabase/client";
import { clearUserScopedStorage } from "../../lib/storage/userScopedStorage";
import { clearOfflineMutations } from "../offline/offlineMutationQueue";
import { defaultNotificationEngine } from "../notifications/notificationEngine";

export async function secureSignOut(userId?: string): Promise<void> {
  if (userId) {
    clearOfflineMutations(userId);
    defaultNotificationEngine.clearInbox(userId);
    clearInsightEventsForUser(userId);
  }

  clearUserLocalData(userId);
  await supabase.auth.signOut();
}

export function clearUserLocalData(userId?: string): void {
  clearUserScopedStorage(userId);
}

export async function validateSessionFreshness(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return false;

  const expiresAt = data.session.expires_at;
  if (!expiresAt) return true;

  return expiresAt * 1000 > Date.now() + 60_000;
}
