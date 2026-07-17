import { AppRoutes } from "../navigation/routes";

export const MIN_PASSWORD_LENGTH = 8;

const LOCALHOST_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export function isLocalhostOrigin(origin: string): boolean {
  return LOCALHOST_ORIGIN_PATTERN.test(origin.replace(/\/$/, ""));
}

/**
 * Origine publique pour les e-mails Supabase Auth.
 * En production, VITE_APP_ORIGIN prime pour éviter un redirectTo localhost
 * si le build ou la config Supabase ne reflète pas le domaine Netlify.
 */
export function resolvePasswordResetRedirectOrigin(runtimeOrigin: string): string {
  const runtime = runtimeOrigin.replace(/\/$/, "");
  const configured = import.meta.env.VITE_APP_ORIGIN?.trim().replace(/\/$/, "");

  if (import.meta.env.PROD && configured) {
    return configured;
  }

  return runtime;
}

export function resolvePasswordResetRedirectTo(runtimeOrigin: string): string {
  const origin = resolvePasswordResetRedirectOrigin(runtimeOrigin);
  return `${origin}${AppRoutes.RESET_PASSWORD}`;
}

export function buildPasswordResetRedirectUrl(origin: string): string {
  return resolvePasswordResetRedirectTo(origin);
}

export function isPasswordRecoveryCallback(location: {
  hash: string;
  search: string;
}): boolean {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (hashParams.get("type") === "recovery") {
    return true;
  }

  const searchParams = new URLSearchParams(location.search);
  return searchParams.get("type") === "recovery";
}

export function validateNewPassword(
  password: string,
  confirmation: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  if (password !== confirmation) {
    return "Les deux mots de passe ne correspondent pas.";
  }

  return null;
}

export function mapPasswordRecoveryError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Une erreur est survenue. Réessaie dans un instant.";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("expired") ||
    message.includes("expir") ||
    (message.includes("invalid") && message.includes("token")) ||
    message.includes("otp_expired") ||
    message.includes("flow_state")
  ) {
    return "Ce lien a expiré ou n'est plus valide. Demande un nouveau lien de réinitialisation.";
  }

  if (
    message.includes("weak") ||
    message.includes("too short") ||
    (message.includes("at least") && message.includes("character"))
  ) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  if (message.includes("same") && message.includes("password")) {
    return "Choisis un mot de passe différent de l'actuel.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Trop de tentatives. Attends quelques minutes avant de réessayer.";
  }

  if (message.includes("valid email") || message.includes("invalid email")) {
    return "Indique une adresse e-mail valide.";
  }

  return error.message || "Une erreur est survenue. Réessaie dans un instant.";
}

export const PASSWORD_RESET_EMAIL_SENT_MESSAGE =
  "Si un compte existe avec cette adresse, tu recevras un e-mail avec un lien pour définir un nouveau mot de passe.";

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  "Ton mot de passe a été mis à jour. Tu peux te connecter avec ton nouveau mot de passe.";
