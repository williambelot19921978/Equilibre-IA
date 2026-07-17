import { resolvePasswordResetRedirectTo } from "../lib/auth/passwordRecovery";
import { supabase } from "../lib/supabase/client";

export async function requestPasswordResetEmail(email: string): Promise<void> {
  const redirectTo = resolvePasswordResetRedirectTo(window.location.origin);

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) {
    throw error;
  }
}

export async function updatePasswordAfterRecovery(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}
