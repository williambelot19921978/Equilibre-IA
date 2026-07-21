/**
 * QA-2 — Guardian persona provisioning and reporting.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  buildGuardianEmail,
  getStablePrimaryCredentials,
  GUARDIAN_PERSONAS,
  type GuardianPersonaId,
  type ProvisioningMode,
} from "../fixtures/users";
import {
  cleanupGuardianDynamicUsers,
  createGuardianAdminClient,
  createHouseholdViaRpc,
  ensureAuthUser,
  finalizeGuardianOnboardingForUser,
  getHouseholdIdForUser,
  joinHouseholdMember,
  signInGuardianUser,
} from "./supabase.helper";
import {
  cleanupGuardianTasks,
  getGuardianPrefix,
  getGuardianRunId,
  guardianTaskTitleHouseholdB,
  seedGuardianBusyCalendar,
  seedGuardianTasks,
} from "./seed-data.helper";

export type PersonaRecord = {
  id: GuardianPersonaId;
  label: string;
  email: string;
  userId: string | null;
  householdId: string | null;
  role: string | null;
  provisioningMode: ProvisioningMode;
  created: boolean;
  sessionFile: string | null;
  notes: string[];
};

export type GuardianPersonaState = {
  runId: string;
  provisionedAt: string;
  serviceRoleAvailable: boolean;
  personas: PersonaRecord[];
  households: Array<{ id: string; name: string; memberIds: string[] }>;
  cleanupPerformed: boolean;
  deletedDynamicUsers: string[];
  seedSummary: string[];
};

function reportPath(): string {
  return path.join(process.cwd(), "tests", "e2e", "reports", "guardian-state.json");
}

async function ensurePersonaHousehold(
  email: string,
  password: string,
  householdName: string,
  displayName: string,
): Promise<{ userId: string; householdId: string }> {
  const { client, userId } = await signInGuardianUser(email, password);
  let householdId = await getHouseholdIdForUser(client, userId);

  if (!householdId) {
    await createHouseholdViaRpc(client, {
      householdName,
      displayName,
    });
    householdId = await getHouseholdIdForUser(client, userId);
  }

  if (!householdId) {
    throw new Error(`Foyer introuvable après création pour ${email}`);
  }

  await client.auth.signOut();
  return { userId, householdId };
}

export function getProvisionedPersona(
  state: GuardianPersonaState | null,
  id: GuardianPersonaId,
): PersonaRecord | undefined {
  return state?.personas.find((persona) => persona.id === id);
}

export async function provisionGuardianPersonas(): Promise<GuardianPersonaState> {
  const runId = getGuardianRunId();
  const admin = createGuardianAdminClient();
  const stable = getStablePrimaryCredentials();
  const seedSummary: string[] = [];
  const personas: PersonaRecord[] = [];
  const households: GuardianPersonaState["households"] = [];
  let deletedDynamicUsers: string[] = [];

  if (!stable?.email || !stable.password) {
    throw new Error(
      "CRITICAL_SKIP: PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis.",
    );
  }

  if (admin) {
    deletedDynamicUsers = await cleanupGuardianDynamicUsers(admin, {
      preserveEmails: [stable.email],
    });
    if (deletedDynamicUsers.length > 0) {
      seedSummary.push(
        `Nettoyage : ${deletedDynamicUsers.length} compte(s) jetable(s) supprimé(s).`,
      );
    }
  }

  const { client: williamClient, userId: williamUserId } = await signInGuardianUser(
    stable.email,
    stable.password,
  );

  const williamHouseholdId = await getHouseholdIdForUser(williamClient, williamUserId);
  if (!williamHouseholdId) {
    throw new Error("Le compte stable William Admin n'a pas de foyer.");
  }

  personas.push({
    id: "williamAdmin",
    label: GUARDIAN_PERSONAS.williamAdmin.label,
    email: stable.email,
    userId: williamUserId,
    householdId: williamHouseholdId,
    role: "admin",
    provisioningMode: "existing",
    created: false,
    sessionFile: "tests/e2e/.auth/william-admin.json",
    notes: ["Compte stable réutilisé (Foyer A)."],
  });

  await cleanupGuardianTasks(williamClient, williamHouseholdId, runId);
  await seedGuardianTasks(williamClient, {
    householdId: williamHouseholdId,
    userId: williamUserId,
    runId,
  });
  await seedGuardianBusyCalendar(williamClient, {
    householdId: williamHouseholdId,
    userId: williamUserId,
    runId,
  });
  seedSummary.push("Tâches + calendrier chargé pour William Admin (Foyer A).");

  let madelineUserId: string | null = null;

  if (admin) {
    const madelineEmail = buildGuardianEmail(GUARDIAN_PERSONAS.madeline, runId);
    const madelineUser = await ensureAuthUser(admin, {
      email: madelineEmail,
      password: GUARDIAN_PERSONAS.madeline.password,
      firstName: GUARDIAN_PERSONAS.madeline.firstName,
    });
    madelineUserId = madelineUser.userId;

    const join = await joinHouseholdMember(admin, {
      householdId: williamHouseholdId,
      userId: madelineUserId,
      displayName: GUARDIAN_PERSONAS.madeline.firstName,
      role: "member",
    });

    personas.push({
      id: "madeline",
      label: GUARDIAN_PERSONAS.madeline.label,
      email: madelineEmail,
      userId: madelineUserId,
      householdId: williamHouseholdId,
      role: "member",
      provisioningMode: "api",
      created: madelineUser.created || join.joined,
      sessionFile: "tests/e2e/.auth/madeline.json",
      notes: join.joined
        ? ["Membre ajouté au foyer William via service role."]
        : ["Membre déjà présent dans le foyer William."],
    });

    seedSummary.push("Madeline provisionnée dans le foyer William.");

    const madelineClient = await signInGuardianUser(
      madelineEmail,
      GUARDIAN_PERSONAS.madeline.password,
    );
    await seedGuardianTasks(madelineClient.client, {
      householdId: williamHouseholdId,
      userId: madelineUserId,
      runId,
    });
    await madelineClient.client.auth.signOut();
    seedSummary.push("Charge légère Madeline (tâches sans calendrier chargé).");

    const rlsBEmail = buildGuardianEmail(GUARDIAN_PERSONAS.rlsHouseholdB, runId);
    const rlsBUser = await ensureAuthUser(admin, {
      email: rlsBEmail,
      password: GUARDIAN_PERSONAS.rlsHouseholdB.password,
      firstName: GUARDIAN_PERSONAS.rlsHouseholdB.firstName,
    });

    const rlsBHousehold = await ensurePersonaHousehold(
      rlsBEmail,
      GUARDIAN_PERSONAS.rlsHouseholdB.password,
      GUARDIAN_PERSONAS.rlsHouseholdB.householdName ?? "Foyer Guardian B",
      GUARDIAN_PERSONAS.rlsHouseholdB.firstName,
    );

    await finalizeGuardianOnboardingForUser(
      rlsBEmail,
      GUARDIAN_PERSONAS.rlsHouseholdB.password,
    );

    personas.push({
      id: "rlsHouseholdB",
      label: GUARDIAN_PERSONAS.rlsHouseholdB.label,
      email: rlsBEmail,
      userId: rlsBUser.userId,
      householdId: rlsBHousehold.householdId,
      role: "admin",
      provisioningMode: "api",
      created: rlsBUser.created,
      sessionFile: "tests/e2e/.auth/rls-household-b.json",
      notes: ["Foyer B isolé pour tests RLS cross-household."],
    });

    const rlsBClient = await signInGuardianUser(
      rlsBEmail,
      GUARDIAN_PERSONAS.rlsHouseholdB.password,
    );
    const householdBTaskTitle = guardianTaskTitleHouseholdB(runId);
    await seedGuardianTasks(rlsBClient.client, {
      householdId: rlsBHousehold.householdId,
      userId: rlsBUser.userId,
      runId,
      titlePrefix: `${getGuardianPrefix()} tâche foyer B`,
    });
    await rlsBClient.client.auth.signOut();

    households.push({
      id: rlsBHousehold.householdId,
      name: GUARDIAN_PERSONAS.rlsHouseholdB.householdName ?? "Foyer Guardian B",
      memberIds: [rlsBUser.userId],
    });

    seedSummary.push(
      `Foyer B provisionné avec tâche isolée (${householdBTaskTitle}).`,
    );
  } else {
    personas.push({
      id: "madeline",
      label: GUARDIAN_PERSONAS.madeline.label,
      email: "(non provisionné)",
      userId: null,
      householdId: williamHouseholdId,
      role: null,
      provisioningMode: "api",
      created: false,
      sessionFile: null,
      notes: [
        "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY absent — scénarios 2 membres limités.",
      ],
    });

    personas.push({
      id: "rlsHouseholdB",
      label: GUARDIAN_PERSONAS.rlsHouseholdB.label,
      email: "(non provisionné)",
      userId: null,
      householdId: null,
      role: null,
      provisioningMode: "api",
      created: false,
      sessionFile: null,
      notes: [
        "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY absent — RLS cross-household indisponible.",
      ],
    });
  }

  households.unshift({
    id: williamHouseholdId,
    name: GUARDIAN_PERSONAS.williamAdmin.householdName ?? "Famille Belot",
    memberIds: [williamUserId, ...(madelineUserId ? [madelineUserId] : [])],
  });

  await williamClient.auth.signOut();

  const state: GuardianPersonaState = {
    runId,
    provisionedAt: new Date().toISOString(),
    serviceRoleAvailable: Boolean(admin),
    personas,
    households,
    cleanupPerformed: deletedDynamicUsers.length > 0 || Boolean(admin),
    deletedDynamicUsers,
    seedSummary,
  };

  mkdirSync(path.dirname(reportPath()), { recursive: true });
  writeFileSync(reportPath(), JSON.stringify(state, null, 2), "utf8");

  return state;
}

export function loadGuardianPersonaState(): GuardianPersonaState | null {
  try {
    const raw = readFileSync(reportPath(), "utf8");
    return JSON.parse(raw) as GuardianPersonaState;
  } catch {
    return null;
  }
}
