type QuickActionCardProps = {
  title: string;
  subtitle?: string;
  icon: string;
  onClick: () => void;
  variant?: "primary" | "default";
};

export function QuickActionCard({
  title,
  subtitle,
  icon,
  onClick,
  variant = "default",
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      className={`quick-action-card quick-action-${variant}`}
      onClick={onClick}
    >
      <span className="quick-action-icon" aria-hidden="true">
        {icon}
      </span>

      <span className="quick-action-text">
        <span className="quick-action-label">{title}</span>
        {subtitle && (
          <span className="quick-action-subtitle">{subtitle}</span>
        )}
      </span>
    </button>
  );
}
