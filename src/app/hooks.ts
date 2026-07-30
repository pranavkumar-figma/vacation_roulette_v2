import { useEffect } from "react";
import { useCustomMediaQuery } from "hooks";

/** True when the user has requested reduced motion (PRD section 8). */
export function usePrefersReducedMotion(): boolean {
  return useCustomMediaQuery("(prefers-reduced-motion: reduce)");
}

const TITLE_SUFFIX = "Vacation Roulette";

/**
 * Sets a descriptive, per-view document title (WCAG 2.4.2). Each screen calls
 * this so the browser tab / history reflects the current page in this SPA.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} — ${TITLE_SUFFIX}` : TITLE_SUFFIX;
  }, [title]);
}
