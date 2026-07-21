import { AuraStar } from "./AuraStar";

export type AuraLogoVariant = "light" | "dark" | "monochrome" | "icon";

type AuraLogoProps = {
  variant?: AuraLogoVariant;
  showWordmark?: boolean;
  className?: string;
};

export function AuraLogo({ variant = "light", showWordmark = true, className = "" }: AuraLogoProps) {
  const iconSrc =
    variant === "monochrome"
      ? "/aura/logo-monochrome.svg"
      : variant === "dark"
        ? "/aura/logo-dark.svg"
        : "/aura/icon.svg";

  return (
    <div
      className={`aura-logo${showWordmark ? "" : " aura-logo-icon-only"}${className ? ` ${className}` : ""}`}
      data-variant={variant}
    >
      <img src={iconSrc} alt="" width={28} height={28} className="aura-logo-mark" aria-hidden="true" />
      {showWordmark && <span className="aura-logo-wordmark">Aura</span>}
      {!showWordmark && <span className="sr-only">Aura</span>}
    </div>
  );
}

/** Compact header mark with live star for coach contexts */
export function AuraHeaderMark() {
  return (
    <span className="aura-logo aura-logo-icon-only" aria-label="Aura">
      <AuraStar variant="insight" size="sm" aria-label="Aura" />
    </span>
  );
}
