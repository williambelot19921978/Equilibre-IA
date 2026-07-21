/**
 * EPIC 4C — Environment for Secure Action Engine certification E2E.
 */

import { loadGuardianEnv, GUARDIAN_FLAGS, GUARDIAN_RUNTIME, root } from "./load-guardian-env.mjs";

export const EPIC4C_FLAGS = {
  ...GUARDIAN_FLAGS,
  VITE_ASSISTANT_IA: "true",
  VITE_HUMAN_MODEL: "true",
  VITE_SECURE_ACTION_ENGINE: "true",
  VITE_HOUSEHOLD_COLLABORATION: "false",
};

export function loadEpic4cEnv() {
  const merged = loadGuardianEnv();
  for (const [key, value] of Object.entries(EPIC4C_FLAGS)) {
    process.env[key] = value;
  }
  return { ...merged, ...EPIC4C_FLAGS, ...GUARDIAN_RUNTIME };
}

export { root, GUARDIAN_RUNTIME };
