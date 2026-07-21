import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { AppRoutes } from "../../lib/navigation/routes";
import { clearPersistedWorkoutPlayer } from "../../lib/workout/workoutPlayerPersistence";

type UserMenuProps = {
  displayName: string;
};

export function UserMenu({ displayName }: UserMenuProps) {
  const initial = displayName.charAt(0).toUpperCase();
  const { signOut } = useAuth();
  const { goToRoute } = useAppNavigation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, closeMenu]);

  const handleSignOut = useCallback(async () => {
    closeMenu();
    clearPersistedWorkoutPlayer();
    await signOut();
    navigate(AppRoutes.LOGIN, { replace: true });
  }, [closeMenu, navigate, signOut]);

  return (
    <div className="app-user-menu" ref={menuRef}>
      <button
        type="button"
        className="app-header-avatar"
        aria-label="Menu utilisateur"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{initial}</span>
      </button>

      {open ? (
        <div className="app-user-menu-panel" role="menu" aria-label="Menu utilisateur">
          <button
            type="button"
            role="menuitem"
            className="app-user-menu-item"
            onClick={() => {
              closeMenu();
              goToRoute(AppRoutes.USER_PROFILE);
            }}
          >
            Mon profil
          </button>

          <hr className="app-user-menu-separator" aria-hidden="true" />

          <button
            type="button"
            role="menuitem"
            className="app-user-menu-item app-user-menu-item-danger"
            onClick={() => void handleSignOut()}
          >
            <span aria-hidden="true">⎋</span>
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}
