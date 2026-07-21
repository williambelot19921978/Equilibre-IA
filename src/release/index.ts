/** EPIC 9 — Beta readiness public API */

export {
  APP_VERSION,
  APP_BETA_LABEL,
  getReleaseChannel,
  getChannelLabel,
  formatDisplayVersion,
  parseVersion,
} from "./version";
export type { ReleaseChannel } from "./version";

export {
  isBetaModeEnabled,
  isBetaBadgeVisible,
  setBetaBadgeVisible,
  getActiveChannel,
  getBetaModeSummary,
} from "./betaMode";

export {
  getLaunchChecklist,
  updateLaunchChecklistItem,
  resetLaunchChecklist,
  getChecklistProgress,
  DEFAULT_LAUNCH_CHECKLIST,
} from "./launchChecklist";
export type {
  LaunchChecklistItem,
  ChecklistStatus,
  ChecklistPriority,
} from "./launchChecklist";

export {
  CHANGELOG,
  getChangelogForVersion,
  getLatestChangelogVersion,
  markChangelogSeen,
  hasUnseenChangelog,
} from "./changelog";
export type { ChangelogEntry, ChangelogEntryKind } from "./changelog";
