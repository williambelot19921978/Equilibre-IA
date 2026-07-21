import type { ReactNode } from "react";

import { AuraStar, type AuraStarVariant } from "./AuraStar";

export type AuraIllustrationKind =
  | "empty"
  | "success"
  | "error"
  | "welcome"
  | "discovery"
  | "offline";

const KIND_META: Record<
  AuraIllustrationKind,
  { variant: AuraStarVariant; title: string; defaultDescription: string }
> = {
  empty: {
    variant: "insight",
    title: "Rien ici pour le moment",
    defaultDescription: "Cet espace se remplira au fil de votre journée.",
  },
  success: {
    variant: "success",
    title: "Bravo",
    defaultDescription: "Vous avancez avec sérénité.",
  },
  error: {
    variant: "insight",
    title: "Un imprévu",
    defaultDescription: "Revenons en douceur — réessayez dans un instant.",
  },
  welcome: {
    variant: "achievement",
    title: "Bienvenue dans Aura",
    defaultDescription: "Votre espace personnel, calme et lumineux.",
  },
  discovery: {
    variant: "coach",
    title: "Découvrir Aura",
    defaultDescription: "Quelques questions pour mieux vous accompagner.",
  },
  offline: {
    variant: "loading",
    title: "Hors connexion",
    defaultDescription: "Vos données restent en sécurité localement.",
  },
};

type AuraIllustrationProps = {
  kind: AuraIllustrationKind;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function AuraIllustration({
  kind,
  title,
  description,
  children,
  className = "",
}: AuraIllustrationProps) {
  const meta = KIND_META[kind];

  return (
    <figure className={`aura-illustration aura-glass${className ? ` ${className}` : ""}`}>
      <div className="aura-illustration-visual">
        <AuraStar variant={meta.variant} size="lg" />
      </div>
      <figcaption>
        <p className="aura-illustration-title">{title ?? meta.title}</p>
        <p className="aura-illustration-desc">{description ?? meta.defaultDescription}</p>
      </figcaption>
      {children}
    </figure>
  );
}
