import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../ui/Button";
import {
  APP_BETA_LABEL,
  APP_VERSION,
  formatDisplayVersion,
  getBetaModeSummary,
  getChannelLabel,
  hasUnseenChangelog,
  isBetaBadgeVisible,
  setBetaBadgeVisible,
} from "../../release";
import { AppRoutes } from "../../lib/navigation/routes";

export function BetaReleaseSettings() {
  const [summary, setSummary] = useState(getBetaModeSummary);
  const [badgeVisible, setBadgeVisible] = useState(isBetaBadgeVisible);
  const unseen = hasUnseenChangelog(APP_VERSION);

  function toggleBadge() {
    const next = !badgeVisible;
    setBetaBadgeVisible(next);
    setBadgeVisible(next);
    setSummary(getBetaModeSummary());
  }

  return (
    <div className="beta-release-settings" data-testid="beta-release-settings">
      <dl className="beta-release-meta">
        <div>
          <dt>Version</dt>
          <dd>{formatDisplayVersion(APP_VERSION)}</dd>
        </div>
        <div>
          <dt>Canal</dt>
          <dd>{getChannelLabel(summary.channel)}</dd>
        </div>
        <div>
          <dt>Mode bêta</dt>
          <dd>{summary.enabled ? APP_BETA_LABEL : "Stable"}</dd>
        </div>
      </dl>

      {summary.enabled && (
        <div className="settings-toggle-row">
          <span>Badge bêta visible</span>
          <Button variant={badgeVisible ? "primary" : "secondary"} size="sm" onClick={toggleBadge}>
            {badgeVisible ? "Visible" : "Masqué"}
          </Button>
        </div>
      )}

      <ul className="settings-link-list">
        <li>
          <Link to={AppRoutes.WHATS_NEW}>
            Quoi de neuf ?{unseen ? " • Nouveau" : ""}
          </Link>
        </li>
      </ul>
    </div>
  );
}
