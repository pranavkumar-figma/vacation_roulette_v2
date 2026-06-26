import { clsx } from "clsx";

/**
 * Delight-only wheel that scrolls across the shortlist of top matches while
 * spinning (PRD section 8: it never shows irrelevant places). The actual 3 picks
 * are resolved deterministically by the engine, not by where the wheel "stops".
 */
export function RouletteWheel({
  items,
  spinning,
}: {
  items: string[];
  spinning: boolean;
}) {
  // Duplicate the list so the -50% scroll keyframe loops seamlessly.
  const loop = items.length ? [...items, ...items] : ["Finding your matches"];
  return (
    <div className="vr-wheel-viewport" role="img" aria-label="Roulette of your top matches">
      <span className="vr-wheel-pointer" aria-hidden="true" />
      <div className={clsx("vr-wheel-track", spinning && "is-spinning")}>
        {loop.map((name, i) => (
          <span key={`${name}-${i}`} className="vr-wheel-item">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
