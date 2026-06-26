import { useCustomMediaQuery } from "hooks";

/** True when the user has requested reduced motion (PRD section 8). */
export function usePrefersReducedMotion(): boolean {
  return useCustomMediaQuery("(prefers-reduced-motion: reduce)");
}
