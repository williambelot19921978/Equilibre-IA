import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import {
  buildPasswordResetRedirectUrl,
  isLocalhostOrigin,
  isPasswordRecoveryCallback,
  mapPasswordRecoveryError,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RESET_EMAIL_SENT_MESSAGE,
  resolvePasswordResetRedirectOrigin,
  resolvePasswordResetRedirectTo,
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
  it("construit l'URL de redirection vers /reset-password en production", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_APP_ORIGIN", "https://equilibre-ia.netlify.app");

    expect(
      resolvePasswordResetRedirectTo("http://localhost:5173"),
    ).toBe(`https://equilibre-ia.netlify.app${AppRoutes.RESET_PASSWORD}`);

    expect(
      resolvePasswordResetRedirectTo("https://equilibre-ia.netlify.app"),
    ).toBe(`https://equilibre-ia.netlify.app${AppRoutes.RESET_PASSWORD}`);

    vi.unstubAllEnvs();
  });

  it("conserve l'origine runtime en développement local", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_APP_ORIGIN", "https://equilibre-ia.netlify.app");

    expect(
      resolvePasswordResetRedirectTo("http://localhost:5173"),
    ).toBe(`http://localhost:5173${AppRoutes.RESET_PASSWORD}`);

    vi.unstubAllEnvs();
  });

  it("n'utilise pas localhost comme redirectTo en production Netlify", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_APP_ORIGIN", "https://equilibre-ia.netlify.app");

    const redirectTo = resolvePasswordResetRedirectTo("http://localhost:5173");
    expect(redirectTo).not.toMatch(/localhost/i);
    expect(redirectTo).toBe(
      `https://equilibre-ia.netlify.app${AppRoutes.RESET_PASSWORD}`,
    );

    vi.unstubAllEnvs();
  });

  it("détecte une origine localhost", () => {
    expect(isLocalhostOrigin("http://localhost:5173")).toBe(true);
    expect(isLocalhostOrigin("https://equilibre-ia.netlify.app")).toBe(false);
  });

  it("resolvePasswordResetRedirectOrigin sans VITE_APP_ORIGIN utilise le runtime", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_APP_ORIGIN", "");

    expect(
      resolvePasswordResetRedirectOrigin("https://equilibre-ia.netlify.app"),
    ).toBe("https://equilibre-ia.netlify.app");

    vi.unstubAllEnvs();
  });

  it("buildPasswordResetRedirectUrl reste compatible", () => {
    expect(buildPasswordResetRedirectUrl("https://equilibre-ia.netlify.app")).toBe(
      `https://equilibre-ia.netlify.app${AppRoutes.RESET_PASSWORD}`,
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

  it("service utilise resetPasswordForEmail avec redirectTo dynamique", () => {
    const service = readSrc("services/passwordRecoveryService.ts");
    expect(service).toContain("resetPasswordForEmail");
    expect(service).toContain("resolvePasswordResetRedirectTo");
    expect(service).toContain("window.location.origin");
    expect(service).toContain("updateUser");
    expect(service).not.toMatch(/localhost:\d+/);
    expect(service).not.toContain("http://localhost");
  });

  it("ProtectedRoute ne bloque pas /reset-password", () => {
    const router = readSrc("app/router/AppRouter.tsx");
    const protectedRoute = readSrc("app/router/ProtectedRoute.tsx");
    expect(router).toContain(
      'path={AppRoutes.RESET_PASSWORD} element={withPageSuspense(<ResetPasswordPage />)}',
    );
    expect(protectedRoute).not.toContain("RESET_PASSWORD");
  });

  it("ResetPasswordPage gère updateUser et redirection login", () => {
    const page = readSrc("pages/ResetPasswordPage.tsx");
    expect(page).toContain("updatePasswordAfterRecovery");
    expect(page).toContain("PASSWORD_RECOVERY");
    expect(page).toContain("AppRoutes.LOGIN");
    expect(page).toContain("validateNewPassword");
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
