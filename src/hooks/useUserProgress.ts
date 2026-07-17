import { useContext } from "react";
import { UserProgressContext } from "../contexts/userProgressContext";

export function useUserProgress() {
  const context = useContext(UserProgressContext);

  if (!context) {
    throw new Error(
      "useUserProgress doit être utilisé à l’intérieur de UserProgressProvider.",
    );
  }

  return context;
}
