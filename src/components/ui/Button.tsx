import type { ButtonHTMLAttributes, ReactNode } from "react";

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonClasses";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${getButtonClassName({ variant, size, fullWidth, loading })}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? "Chargement..." : children}
    </button>
  );
}
