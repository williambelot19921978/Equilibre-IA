/**
 * Détermine si la route protégée doit afficher l'écran de chargement
 * (uniquement au premier chargement auth/progress, pas lors d'un refresh en arrière-plan).
 */
export function shouldShowProtectedRouteLoading({
  authLoading,
  userId,
  progressLoadedForUserId,
}: {
  authLoading: boolean;
  userId: string | undefined;
  progressLoadedForUserId: string | null;
}): boolean {
  if (authLoading) {
    return true;
  }

  if (!userId) {
    return false;
  }

  return progressLoadedForUserId !== userId;
}

/**
 * Détermine si le progress utilisateur est en chargement initial.
 */
export function resolveUserProgressLoading({
  authLoading,
  userId,
  loadedUserId,
}: {
  authLoading: boolean;
  userId: string | undefined;
  loadedUserId: string | null;
}): boolean {
  if (authLoading) {
    return true;
  }

  if (!userId) {
    return false;
  }

  return loadedUserId !== userId;
}
