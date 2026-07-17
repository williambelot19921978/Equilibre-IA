import { APP_BETA_LABEL, APP_VERSION } from "../../config/appVersion";

type BetaBadgeProps = {
  compact?: boolean;
};

export function BetaBadge({ compact = false }: BetaBadgeProps) {
  return (
    <span
      className={`beta-badge${compact ? " beta-badge-compact" : ""}`}
      title={`${APP_BETA_LABEL} — v${APP_VERSION}`}
    >
      {APP_BETA_LABEL}
      {!compact && <small>v{APP_VERSION}</small>}
    </span>
  );
}
