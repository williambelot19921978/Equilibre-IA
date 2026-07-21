import type { ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "info" | "muted";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`ds-badge ds-badge-${variant}${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
