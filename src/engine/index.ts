import { DESTINATIONS } from "../data/destinations";
import { findOrigin } from "../data/origins";
import { filterDestinations, type FilterContext } from "./filter";
import {
  budgetTotalUsd,
  makeMoneyFormatter,
  nightsBetween,
  travelMonth,
} from "./format";
import { createMockProviders, enrich, type Providers } from "./providers";
import { generateRationale } from "./rationale";
import { STRONG_THRESHOLD, scoreDestination } from "./score";
import { createRng } from "./seededRng";
import type {
  Destination,
  EngineResult,
  OriginAirport,
  Pick,
  RelaxSuggestion,
  ScoredDestination,
  TripInputs,
} from "./types";

export * from "./types";
export { flightsUrl, staysUrl, visaInfoUrl } from "./links";
export {
  makeMoneyFormatter,
  formatDateRange,
  detectDisplayCurrency,
  nightsBetween,
  travelMonth,
  budgetTotalUsd,
} from "./format";
export { createMockProviders } from "./providers";

/** Size of the shortlist handed to the roulette (PRD: ~8-12). */
export const SHORTLIST_SIZE = 10;

export interface RecommendOptions {
  /** Force degraded mode to exercise the "estimated" fallback (PRD). */
  degraded?: boolean;
  catalog?: Destination[];
}

/** Resolve the origin airport, falling back to a US-west default if unknown. */
export function resolveOrigin(inputs: TripInputs): OriginAirport {
  const found = findOrigin(inputs.origin.iata);
  if (found) return found;
  return {
    city: inputs.origin.city || "your city",
    iata: inputs.origin.iata || "SFO",
    country: "United States",
    countryCode: "US",
    region: "us_west",
  };
}

function suggestRelaxations(
  catalog: Destination[],
  inputs: TripInputs,
  ctx: FilterContext,
): RelaxSuggestion[] {
  const base = filterDestinations(catalog, inputs, ctx).length;
  const out: RelaxSuggestion[] = [];

  if (!inputs.reach.international) {
    const n = filterDestinations(
      catalog,
      { ...inputs, reach: { ...inputs.reach, international: true } },
      ctx,
    ).length;
    if (n > base) out.push("allow_international");
  }

  const moreFlight = filterDestinations(
    catalog,
    {
      ...inputs,
      reach: { ...inputs.reach, maxFlightHours: inputs.reach.maxFlightHours + 6 },
    },
    ctx,
  ).length;
  if (moreFlight > base) out.push("more_flight_time");

  // Budget and flex are soft constraints, so they are always safe to suggest.
  out.push("widen_budget");
  out.push("more_flex_days");

  return out.slice(0, 4);
}

export function recommend(
  inputs: TripInputs,
  opts: RecommendOptions = {},
): EngineResult {
  const catalog = opts.catalog ?? DESTINATIONS;
  const providers: Providers = createMockProviders(opts.degraded ?? false);
  const origin = resolveOrigin(inputs);
  const month = travelMonth(inputs);
  const nights = nightsBetween(inputs.dates.start, inputs.dates.end);
  const budgetUsd = budgetTotalUsd(inputs, providers.fx);
  const ctx: FilterContext = { origin, month };

  const survivors = filterDestinations(catalog, inputs, ctx);

  if (survivors.length === 0) {
    return {
      status: "no_match",
      shortlist: [],
      degraded: providers.degraded,
      tooTight: suggestRelaxations(catalog, inputs, ctx),
    };
  }

  const scored: ScoredDestination[] = survivors
    .map((destination) => {
      const enrichment = enrich(destination, inputs, origin, nights, providers);
      const { score, breakdown } = scoreDestination({
        destination,
        enrichment,
        inputs,
        origin,
        budgetTotalUsd: budgetUsd,
        month,
      });
      return {
        destination,
        enrichment,
        score,
        breakdown,
        strong: score >= STRONG_THRESHOLD,
      };
    })
    .sort((a, b) => b.score - a.score);

  const shortlist = scored.slice(0, SHORTLIST_SIZE);
  const strongCount = scored.filter((s) => s.strong).length;

  return {
    status: strongCount >= 3 ? "ok" : "few_matches",
    shortlist,
    degraded: providers.degraded,
    tooTight: strongCount >= 3 ? [] : suggestRelaxations(catalog, inputs, ctx),
  };
}

/**
 * Fully describe a single destination for the trip (score, enrichment, and
 * rationale). Used by the detail screen so deep links / refreshes work even when
 * the in-memory picks are gone.
 */
export function describeDestination(
  id: string,
  inputs: TripInputs,
  opts: RecommendOptions = {},
): Pick | null {
  const catalog = opts.catalog ?? DESTINATIONS;
  const destination = catalog.find((d) => d.id === id);
  if (!destination) return null;

  const providers = createMockProviders(opts.degraded ?? false);
  const origin = resolveOrigin(inputs);
  const month = travelMonth(inputs);
  const nights = nightsBetween(inputs.dates.start, inputs.dates.end);
  const budgetUsd = budgetTotalUsd(inputs, providers.fx);
  const money = makeMoneyFormatter(inputs.budget.currency, providers.fx);

  const enrichment = enrich(destination, inputs, origin, nights, providers);
  const { score, breakdown } = scoreDestination({
    destination,
    enrichment,
    inputs,
    origin,
    budgetTotalUsd: budgetUsd,
    month,
  });
  const strong = score >= STRONG_THRESHOLD;

  return {
    destination,
    enrichment,
    score,
    breakdown,
    strong,
    stretch: !strong,
    rationale: generateRationale({
      destination,
      enrichment,
      breakdown,
      inputs,
      origin,
      budgetTotalUsd: budgetUsd,
      month,
      formatMoney: (usd) => money.format(usd),
    }),
  };
}

/** Stable key for the inputs, so the same trip seeds the same spins. */
export function stableInputsKey(inputs: TripInputs): string {
  return JSON.stringify(inputs);
}

/** Build the seed for a given spin index (PRD section 8 determinism). */
export function spinSeed(inputs: TripInputs, spinIndex: number): string {
  return `${stableInputsKey(inputs)}#${spinIndex}`;
}

/**
 * Spin the roulette across the shortlist ONLY and resolve to 3 distinct picks
 * (PRD section 8). Higher-scoring destinations are more likely, but selection is
 * fully deterministic for a given seed. Picks below the strong threshold are
 * flagged as "stretch".
 */
export function spin(
  shortlist: ScoredDestination[],
  inputs: TripInputs,
  seed: string,
  count = 3,
): Pick[] {
  const rng = createRng(seed);
  const pool = [...shortlist];
  const chosen: ScoredDestination[] = [];

  while (pool.length > 0 && chosen.length < count) {
    const totalWeight = pool.reduce((sum, s) => sum + Math.max(1, s.score), 0);
    let r = rng.next() * totalWeight;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= Math.max(1, pool[i].score);
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    chosen.push(pool.splice(idx, 1)[0]);
  }

  const providers = createMockProviders(false);
  const origin = resolveOrigin(inputs);
  const month = travelMonth(inputs);
  const budgetUsd = budgetTotalUsd(inputs, providers.fx);
  const money = makeMoneyFormatter(inputs.budget.currency, providers.fx);

  return chosen.map((s) => ({
    ...s,
    stretch: !s.strong,
    rationale: generateRationale({
      destination: s.destination,
      enrichment: s.enrichment,
      breakdown: s.breakdown,
      inputs,
      origin,
      budgetTotalUsd: budgetUsd,
      month,
      formatMoney: (usd) => money.format(usd),
    }),
  }));
}
