/**
 * EPIC 4B — Environment for certification E2E (flags ON, production defaults unchanged).
 */

import { loadGuardianEnv, GUARDIAN_FLAGS, GUARDIAN_RUNTIME, root } from "./load-guardian-env.mjs";

export const EPIC4B_FLAGS = {
  ...GUARDIAN_FLAGS,
  VITE_ASSISTANT_IA: "true",
  VITE_HUMAN_MODEL: "true",
};

export function loadEpic4bEnv() {
  const merged = loadGuardianEnv();
  for (const [key, value] of Object.entries(EPIC4B_FLAGS)) {
    process.env[key] = value;
  }
  return { ...merged, ...EPIC4B_FLAGS, ...GUARDIAN_RUNTIME };
}

export { root, GUARDIAN_RUNTIME };
