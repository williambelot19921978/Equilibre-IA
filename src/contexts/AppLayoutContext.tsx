import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppLayoutContextValue = {
  title: string | undefined;
  setTitle: (title: string | undefined) => void;
  headerActions: ReactNode;
  setHeaderActions: (actions: ReactNode) => void;
};

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

export function AppLayoutProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | undefined>();
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      title,
      setTitle,
      headerActions,
      setHeaderActions,
    }),
    [title, headerActions],
  );

  return (
    <AppLayoutContext.Provider value={value}>
      {children}
    </AppLayoutContext.Provider>
  );
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext);

  if (!context) {
    throw new Error("useAppLayout must be used within AppLayoutProvider");
  }

  return context;
}
