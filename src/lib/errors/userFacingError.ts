/**
 * Maps technical errors to user-facing French messages.
 */

const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Identifiants incorrects. Vérifie ton e-mail et ton mot de passe.",
  "Email not confirmed": "Confirme ton adresse e-mail avant de te connecter.",
  "User already registered": "Un compte existe déjà avec cette adresse e-mail.",
  "Password should be at least 6 characters":
    "Le mot de passe doit contenir au moins 6 caractères.",
};

export function mapUserFacingError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  for (const [key, label] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.includes(key)) {
      return label;
    }
  }

  if (message.startsWith("[") && message.includes("]")) {
    if (message.includes("row-level security") || message.includes("RLS")) {
      return "Accès refusé. Vérifie que tu es connecté au bon compte.";
    }
    if (message.includes("migrations Supabase") || message.includes("does not exist")) {
      return "Service temporairement indisponible. Réessaie dans quelques instants.";
    }
    return fallback;
  }

  if (/^[A-Za-z ]+$/.test(message) && !message.includes("é") && message.length < 120) {
    return fallback;
  }

  return message.length > 180 ? fallback : message;
}

export function mapAuthError(error: unknown): string {
  return mapUserFacingError(error, "Impossible de se connecter. Réessaie.");
}

export function mapSignupError(error: unknown): string {
  return mapUserFacingError(error, "Impossible de créer le compte. Réessaie.");
}

export function mapPasswordRecoveryError(error: unknown): string {
  return mapUserFacingError(error, "Impossible d'envoyer l'e-mail de réinitialisation.");
}
