/**
 * QA-2 — Quality Guardian test personas with explicit provisioning modes.
 *
 * provisioningMode:
 * - existing — stable account reused across runs (William Admin)
 * - api      — created once per run by guardian.setup via service role
 * - ui       — created only through the signup UI (never pre-provisioned by API)
 */

export type ProvisioningMode = "api" | "ui" | "existing";

export type GuardianPersonaId =
  | "williamAdmin"
  | "madeline"
  | "rlsHouseholdB"
  | "onboardingDisposable"
  | "soloSignup";

export type GuardianPersona = {
  readonly id: GuardianPersonaId;
  readonly label: string;
  readonly firstName: string;
  readonly householdName?: string;
  readonly partnerName?: string;
  readonly emailPrefix: string;
  readonly password: string;
  readonly provisioningMode: ProvisioningMode;
};

const DEFAULT_PASSWORD =
  process.env.GUARDIAN_TEST_PASSWORD?.trim() || "GuardianTest2026!";

export const GUARDIAN_PERSONAS: Record<GuardianPersonaId, GuardianPersona> = {
  williamAdmin: {
    id: "williamAdmin",
    label: "William Admin",
    firstName: "William",
    householdName: "Famille Belot",
    partnerName: "Madeline",
    emailPrefix: "guardian-william",
    password: DEFAULT_PASSWORD,
    provisioningMode: "existing",
  },
  madeline: {
    id: "madeline",
    label: "Madeline",
    firstName: "Madeline",
    householdName: "Famille Belot",
    partnerName: "William",
    emailPrefix: "guardian-madeline",
    password: DEFAULT_PASSWORD,
    provisioningMode: "api",
  },
  rlsHouseholdB: {
    id: "rlsHouseholdB",
    label: "Foyer B (RLS)",
    firstName: "RLS-B",
    householdName: "Foyer Guardian B",
    emailPrefix: "guardian-rls-b",
    password: DEFAULT_PASSWORD,
    provisioningMode: "api",
  },
  onboardingDisposable: {
    id: "onboardingDisposable",
    label: "Onboarding jetable",
    firstName: "Famille",
    householdName: "Famille Test",
    partnerName: "Partenaire Test",
    emailPrefix: "guardian-onboarding",
    password: DEFAULT_PASSWORD,
    provisioningMode: "ui",
  },
  soloSignup: {
    id: "soloSignup",
    label: "Utilisateur Solo (signup UI)",
    firstName: "Solo",
    householdName: "Utilisateur Solo",
    emailPrefix: "guardian-solo-ui",
    password: DEFAULT_PASSWORD,
    provisioningMode: "ui",
  },
};

export function buildGuardianEmail(
  persona: GuardianPersona,
  suffix = Date.now(),
): string {
  return `${persona.emailPrefix}.${suffix}@guardian.equilibre.test`;
}

export function buildGuardianScenarioEmail(
  persona: GuardianPersona,
  scenarioSuffix: string,
  runId: string,
): string {
  return `${persona.emailPrefix}.${scenarioSuffix}.${runId}@guardian.equilibre.test`;
}

export function getStablePrimaryCredentials(): {
  email: string;
  password: string;
} | null {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) return null;
  return { email, password };
}

export function hasStablePrimaryCredentials(): boolean {
  return getStablePrimaryCredentials() !== null;
}

export function assertPersonaProvisioningMode(
  persona: GuardianPersona,
  expected: ProvisioningMode,
): void {
  if (persona.provisioningMode !== expected) {
    throw new Error(
      `Persona ${persona.id} attend provisioningMode=${expected}, reçu ${persona.provisioningMode}`,
    );
  }
}

export function listApiProvisionedPersonas(): GuardianPersona[] {
  return Object.values(GUARDIAN_PERSONAS).filter(
    (persona) => persona.provisioningMode === "api",
  );
}

export function listUiProvisionedPersonas(): GuardianPersona[] {
  return Object.values(GUARDIAN_PERSONAS).filter(
    (persona) => persona.provisioningMode === "ui",
  );
}
