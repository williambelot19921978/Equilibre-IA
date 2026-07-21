import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../hooks/useAuth";
import {
  bridgeProactiveDispatchToInbox,
  defaultConnectivityEngine,
  defaultCrashReporter,
  defaultSyncEngine,
  startAutoSync,
  type ConnectivityState,
  type SyncSnapshot,
} from "../mobileReliability";

type MobileReliabilityContextValue = {
  connectivity: ConnectivityState;
  sync: SyncSnapshot | null;
  refreshSync: () => void;
};

const MobileReliabilityContext = createContext<MobileReliabilityContextValue>({
  connectivity: "online",
  sync: null,
  refreshSync: () => undefined,
});

export function MobileReliabilityProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();
  const [connectivity, setConnectivity] = useState<ConnectivityState>(
    defaultConnectivityEngine.getState(),
  );
  const [sync, setSync] = useState<SyncSnapshot | null>(null);

  useEffect(() => {
    return defaultConnectivityEngine.subscribe(setConnectivity);
  }, []);

  useEffect(() => {
    return defaultCrashReporter.installGlobalHandlers();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setSync(null);
      return;
    }

    const unbridge = bridgeProactiveDispatchToInbox(user.id);
    const stopAutoSync = startAutoSync(user.id);

    void defaultSyncEngine.syncNow(user.id).then(setSync);

    return () => {
      unbridge();
      stopAutoSync();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setSync(defaultSyncEngine.getSnapshot(user.id));
  }, [user?.id, connectivity]);

  function refreshSync() {
    if (!user?.id) return;
    void defaultSyncEngine.syncNow(user.id).then(setSync);
  }

  return (
    <MobileReliabilityContext.Provider value={{ connectivity, sync, refreshSync }}>
      {children}
    </MobileReliabilityContext.Provider>
  );
}

export function useMobileReliability(): MobileReliabilityContextValue {
  return useContext(MobileReliabilityContext);
}
