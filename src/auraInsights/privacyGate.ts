/**
 * EPIC 8B — Privacy gate — respects Trust Center analytics preference.
 */

import { getPrivacyPreferences } from "../trustCenter/privacyPreferencesStore";

export function isAnalyticsAllowedForUser(userId: string): boolean {
  return getPrivacyPreferences(userId).shareAnalytics;
}
