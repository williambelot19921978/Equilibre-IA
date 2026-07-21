import { useAuth } from "../hooks/useAuth";
import { AppErrorFallback } from "../components/errors/AppErrorFallback";

export function NotFoundPage() {
  const { user } = useAuth();

  return (
    <AppErrorFallback
      userId={user?.id ?? null}
      title="Page introuvable"
      description={
        user
          ? "Cette page n’existe pas ou a été déplacée."
          : "Cette page n’existe pas. Connecte-toi pour accéder à l’application."
      }
    />
  );
}
