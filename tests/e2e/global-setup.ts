/**
 * QA-2 — Playwright global setup: persona provisioning + seed data.
 */

import { provisionGuardianPersonas } from "./helpers/personas.helper";

export default async function globalSetup(): Promise<void> {
  process.env.GUARDIAN_RUN_ID =
    process.env.GUARDIAN_RUN_ID ??
    new Date().toISOString().replace(/[:.]/g, "-");

  await provisionGuardianPersonas();
}
