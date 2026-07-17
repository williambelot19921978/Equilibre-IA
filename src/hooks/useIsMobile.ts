import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(breakpointQuery = MOBILE_QUERY): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(breakpointQuery).matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia(breakpointQuery);
    const handler = () => setIsMobile(media.matches);
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [breakpointQuery]);

  return isMobile;
}
