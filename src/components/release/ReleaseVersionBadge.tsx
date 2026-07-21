import { memo } from "react";
import { Link } from "react-router-dom";

import {
  formatDisplayVersion,
  getChannelLabel,
  getReleaseChannel,
  isBetaBadgeVisible,
  isBetaModeEnabled,
  APP_VERSION,
} from "../../release";
import { AppRoutes } from "../../lib/navigation/routes";

type ReleaseVersionBadgeProps = {
  compact?: boolean;
  linkToSettings?: boolean;
};

export const ReleaseVersionBadge = memo(function ReleaseVersionBadge({
  compact = false,
  linkToSettings = true,
}: ReleaseVersionBadgeProps) {
  if (!isBetaModeEnabled() || !isBetaBadgeVisible()) return null;

  const channel = getReleaseChannel();
  const label = getChannelLabel(channel);
  const version = formatDisplayVersion(APP_VERSION);

  const content = (
    <span
      className={`release-version-badge release-channel-${channel}${compact ? " release-version-badge-compact" : ""}`}
      title={`Aura ${label} — ${version}`}
      data-testid="release-version-badge"
    >
      <span className="release-channel-pill">{label}</span>
      {!compact && <span className="release-version-text">{version}</span>}
    </span>
  );

  if (linkToSettings) {
    return (
      <Link to={AppRoutes.SETTINGS} className="release-version-badge-link" aria-label={`Version ${version}, canal ${label}`}>
        {content}
      </Link>
    );
  }

  return content;
});
