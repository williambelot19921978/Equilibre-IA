import type { ReactNode } from "react";

import { Button } from "./Button";

export type ErrorStateKind = "error" | "offline" | "connection" | "not-found";

const KIND_META: Record<
  ErrorStateKind,
  { icon: string; defaultTitle: string; defaultDescription: string }
> = {
  error: {
    icon: "⚠️",
    defaultTitle: "Une erreur est survenue",
    defaultDescription: "Nous n'avons pas pu charger cette section. Réessayez dans un instant.",
  },
  offline: {
    icon: "📡",
    defaultTitle: "Vous êtes hors ligne",
    defaultDescription: "Vérifiez votre connexion internet pour continuer.",
  },
  connection: {
    icon: "🔌",
    defaultTitle: "Connexion impossible",
    defaultDescription: "Le serveur met du temps à répondre. Patientez ou réessayez.",
  },
  "not-found": {
    icon: "🔍",
    defaultTitle: "Rien ici pour le moment",
    defaultDescription: "Cette section est vide ou indisponible.",
  },
};

type ErrorStateProps = {
  kind?: ErrorStateKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
  className?: string;
};

export function ErrorState({
  kind = "error",
  title,
  description,
  onRetry,
  retryLabel = "Réessayer",
  children,
  className = "",
}: ErrorStateProps) {
  const meta = KIND_META[kind];

  return (
    <section
      className={`ds-error-state ds-error-state-${kind}${className ? ` ${className}` : ""}`}
      role="alert"
      aria-live="polite"
    >
      <span className="ds-error-state-icon" aria-hidden="true">
        {meta.icon}
      </span>
      <h3>{title ?? meta.defaultTitle}</h3>
      <p>{description ?? meta.defaultDescription}</p>
      {children}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </section>
  );
}
