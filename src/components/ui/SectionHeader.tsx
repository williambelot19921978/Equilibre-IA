import type { ReactNode } from "react";

type SectionHeaderProps = {
  label?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({
  label,
  title,
  subtitle,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <header className={`ds-section-header ${className}`.trim()}>
      <div className="ds-section-header-text">
        {label && <p className="ds-label">{label}</p>}
        <h2 className="ds-section-title">{title}</h2>
        {subtitle && <p className="ds-section-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ds-section-header-actions">{actions}</div>}
    </header>
  );
}
