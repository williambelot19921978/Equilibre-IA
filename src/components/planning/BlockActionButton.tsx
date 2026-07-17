import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Button } from "../ui/Button";

type BlockActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  fullWidth?: boolean;
};

export function BlockActionButton({
  icon,
  label,
  tone = "secondary",
  fullWidth = false,
  className = "",
  ...props
}: BlockActionButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={tone}
      fullWidth={fullWidth}
      className={`block-action-button${className ? ` ${className}` : ""}`}
      {...props}
    >
      <span className="block-action-button-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="block-action-button-label">{label}</span>
    </Button>
  );
}
