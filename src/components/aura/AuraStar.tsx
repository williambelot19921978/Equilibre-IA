import type { CSSProperties } from "react";

export type AuraStarVariant = "coach" | "insight" | "success" | "loading" | "achievement";
export type AuraStarSize = "sm" | "md" | "lg";

type AuraStarProps = {
  variant?: AuraStarVariant;
  size?: AuraStarSize;
  className?: string;
  decorative?: boolean;
  "aria-label"?: string;
  style?: CSSProperties;
};

const VARIANT_LABELS: Record<AuraStarVariant, string> = {
  coach: "Conseil du coach",
  insight: "Insight Aura",
  success: "Succès",
  loading: "Chargement",
  achievement: "Réussite",
};

export function AuraStar({
  variant = "insight",
  size = "md",
  className = "",
  decorative = false,
  "aria-label": ariaLabel,
  style,
}: AuraStarProps) {
  const label = decorative ? undefined : (ariaLabel ?? VARIANT_LABELS[variant]);

  return (
    <span
      className={`aura-star aura-star-${size} aura-star-${variant}${className ? ` ${className}` : ""}`}
      role={decorative ? "presentation" : "img"}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
      style={style}
    >
      <svg
        className="aura-star-svg"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="aura-star-grad" x1="4" y1="4" x2="28" y2="28">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <radialGradient id="aura-star-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8d5a8" />
            <stop offset="100%" stopColor="#c9a962" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#aura-star-gold)" opacity="0.35" />
        <path
          d="M16 3 L19 13 L29 13 L21 19.5 L24 29 L16 23 L8 29 L11 19.5 L3 13 L13 13 Z"
          fill="url(#aura-star-grad)"
          stroke="rgba(201, 169, 98, 0.5)"
          strokeWidth="0.75"
        />
      </svg>
    </span>
  );
}
