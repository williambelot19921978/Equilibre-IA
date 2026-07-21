/**
 * EPIC 7B — Bridge Proactive Dispatcher → Notification Engine.
 */

import { defaultNotificationDispatcher } from "../../proactiveIntelligenceEngine/notification/notificationDispatcher";
import { defaultNotificationEngine } from "./notificationEngine";

export function bridgeProactiveDispatchToInbox(userId: string): () => void {
  defaultNotificationDispatcher.setDispatchListener((record) => {
    defaultNotificationEngine.deliver({
      userId,
      proactiveNotification: record,
      title: record.message,
      important: false,
    });
  });

  return () => {
    defaultNotificationDispatcher.setDispatchListener(undefined);
  };
}
