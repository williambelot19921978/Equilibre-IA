import type { ReactNode } from "react";

import { AuraIllustration, type AuraIllustrationKind } from "../aura/AuraIllustration";
import { AuraStar, type AuraStarVariant } from "../aura/AuraStar";
import { Button } from "./Button";

type EmptyStateProps = {
  icon?: string;
  aura?: AuraIllustrationKind | AuraStarVariant;
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  children?: ReactNode;
  className?: string;
};

const STAR_VARIANTS = new Set<AuraStarVariant>([
  "coach",
  "insight",
  "success",
  "loading",
  "achievement",
]);

export function EmptyState({
  icon,
  aura = "empty",
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  className = "",
}: EmptyStateProps) {
  const useIllustration =
    aura === "empty" ||
    aura === "welcome" ||
    aura === "discovery" ||
    aura === "offline" ||
    aura === "error" ||
    aura === "success";

  return (
    <section
      className={`ds-empty-state${className ? ` ${className}` : ""}`}
      aria-label={title}
    >
      {useIllustration && aura ? (
        <AuraIllustration kind={aura} title={title} description={description} />
      ) : aura && STAR_VARIANTS.has(aura as AuraStarVariant) ? (
        <AuraStar variant={aura as AuraStarVariant} size="lg" />
      ) : (
        <span className="ds-empty-state-icon" aria-hidden="true">
          {icon ?? "✨"}
        </span>
      )}
      {!useIllustration && (
        <>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </>
      )}
      {children}
      {(primaryAction || secondaryAction) && (
        <div className="ds-empty-state-actions">
          {primaryAction && (
            <Button variant="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
