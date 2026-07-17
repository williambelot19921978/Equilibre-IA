import { useEffect } from "react";
import { useAppLayout } from "../contexts/AppLayoutContext";

export function useAppPageTitle(title: string | undefined) {
  const { setTitle } = useAppLayout();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(undefined);
  }, [title, setTitle]);
}
