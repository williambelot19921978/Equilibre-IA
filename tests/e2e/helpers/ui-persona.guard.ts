/**
 * QA-2 — Guard against double provisioning of UI-only personas.
 */

import { createGuardianAdminClient } from "./supabase.helper";

export async function assertUiPersonaNotPreProvisioned(email: string): Promise<void> {
  const admin = createGuardianAdminClient();
  if (!admin) return;

  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    throw new Error(`UI persona was pre-provisioned unexpectedly: ${email}`);
  }
}
