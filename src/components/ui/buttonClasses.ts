export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "icon";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
}: ButtonClassOptions = {}): string {
  return [
    "ui-button",
    `ui-button-${variant}`,
    `ui-button-${size}`,
    fullWidth ? "ui-button-full" : "",
    loading ? "ui-button-loading" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
