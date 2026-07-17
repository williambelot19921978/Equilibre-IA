import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildPasswordResetRedirectUrl,
  isPasswordRecoveryCallback,
  mapPasswordRecoveryError,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RESET_EMAIL_SENT_MESSAGE,
  validateNewPassword,
} from "../auth/passwordRecovery";
import { AppRoutes } from "../navigation/routes";
import { shouldShowConversationBar } from "../navigation/conversationAccess";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("Mot de passe oublié — passwordRecovery", () => {
  it("construit l'URL de redirection vers /reset-password", () => {
    expect(buildPasswordResetRedirectUrl("https://equilibre-ia.netlify.app")).toBe(
      `https://equilibre-ia.netlify.app${AppRoutes.RESET_PASSWORD}`,
    );
    expect(buildPasswordResetRedirectUrl("http://localhost:5173/")).toBe(
      `http://localhost:5173${AppRoutes.RESET_PASSWORD}`,
    );
  });

  it("détecte un callback Supabase type=recovery dans le hash", () => {
    expect(
      isPasswordRecoveryCallback({
        hash: "#access_token=abc&type=recovery&refresh_token=xyz",
        search: "",
      }),
    ).toBe(true);
  });

  it("détecte un callback Supabase type=recovery dans la query", () => {
    expect(
      isPasswordRecoveryCallback({
        hash: "",
        search: "?type=recovery&code=abc",
      }),
    ).toBe(true);
  });

  it("rejette un mot de passe trop court", () => {
    expect(validateNewPassword("abc", "abc")).toContain(
      String(MIN_PASSWORD_LENGTH),
    );
  });

  it("rejette une confirmation différente", () => {
    expect(validateNewPassword("12345678", "87654321")).toMatch(
      /ne correspondent pas/i,
    );
  });

  it("accepte un mot de passe valide", () => {
    expect(validateNewPassword("12345678", "12345678")).toBeNull();
  });

  it("mappe un lien expiré", () => {
    expect(
      mapPasswordRecoveryError(new Error("Email link is invalid or has expired")),
    ).toMatch(/expiré/i);
  });

  it("mappe un mot de passe trop faible", () => {
    expect(
      mapPasswordRecoveryError(new Error("Password should be at least 8 characters")),
    ).toMatch(/8 caractères/i);
  });

  it("message d'envoi d'e-mail non révélateur", () => {
    expect(PASSWORD_RESET_EMAIL_SENT_MESSAGE).toMatch(/Si un compte existe/i);
  });
});

describe("Mot de passe oublié — intégration shell", () => {
  it("LoginPage contient le lien Mot de passe oublié", () => {
    const login = readSrc("pages/LoginPage.tsx");
    expect(login).toContain("Mot de passe oublié ?");
    expect(login).toContain("AppRoutes.FORGOT_PASSWORD");
  });

  it("service utilise resetPasswordForEmail avec redirectTo", () => {
    const service = readSrc("services/passwordRecoveryService.ts");
    expect(service).toContain("resetPasswordForEmail");
    expect(service).toContain("buildPasswordResetRedirectUrl");
    expect(service).toContain("updateUser");
  });

  it("routes publiques forgot/reset enregistrées", () => {
    expect(AppRoutes.FORGOT_PASSWORD).toBe("/forgot-password");
    expect(AppRoutes.RESET_PASSWORD).toBe("/reset-password");
    const router = readSrc("app/router/AppRouter.tsx");
    expect(router).toContain("ForgotPasswordPage");
    expect(router).toContain("ResetPasswordPage");
    expect(router).not.toContain("<PublicAuthRoute>\n            <ResetPasswordPage");
  });

  it("barre conversation absente sur forgot/reset password", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.FORGOT_PASSWORD,
        progressLoading: false,
      }),
    ).toBe(false);
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.RESET_PASSWORD,
        progressLoading: false,
      }),
    ).toBe(false);
  });
});
