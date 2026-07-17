import type { CSSProperties, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "ghost";
  accent?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Card({
  children,
  className = "",
  variant = "default",
  accent,
  style,
  onClick,
}: CardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={[
        "ds-card",
        `ds-card-${variant}`,
        onClick ? "ds-card-interactive" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        accent
          ? ({ ...style, "--card-accent": accent } as CSSProperties)
          : style
      }
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
