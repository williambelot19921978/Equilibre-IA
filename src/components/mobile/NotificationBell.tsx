import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { defaultNotificationEngine } from "../../mobileReliability";
import type { DeliveredNotification } from "../../mobileReliability";
import { AppRoutes } from "../../lib/navigation/routes";

type NotificationBellProps = {
  onOpen?: () => void;
};

export function NotificationBell({ onOpen }: NotificationBellProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<DeliveredNotification[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setInbox([]);
      return;
    }
    setInbox(defaultNotificationEngine.getInbox(user.id));
  }, [user?.id, open]);

  const unread = user?.id ? defaultNotificationEngine.getUnreadCount(user.id) : 0;

  function toggleOpen() {
    setOpen((value) => !value);
    onOpen?.();
  }

  function markRead(id: string) {
    if (!user?.id) return;
    defaultNotificationEngine.markRead(user.id, id);
    setInbox(defaultNotificationEngine.getInbox(user.id));
  }

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="app-header-notifications"
        aria-label={`Notifications${unread > 0 ? ` — ${unread} non lues` : ""}`}
        aria-expanded={open}
        onClick={toggleOpen}
        data-testid="notification-bell"
      >
        🔔
        {unread > 0 && <span className="notification-bell-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notification-panel ds-animate-in" role="dialog" aria-label="Notifications">
          <header>
            <strong>Notifications</strong>
            <Link to={AppRoutes.NOTIFICATION_SETTINGS} onClick={() => setOpen(false)}>
              Réglages
            </Link>
          </header>
          {inbox.length === 0 ? (
            <p className="notification-panel-empty">Aucune notification pour le moment.</p>
          ) : (
            <ul>
              {inbox.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => markRead(item.id)}>
                    <span>{item.title}</span>
                    <small>{item.body}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
