import type { Destination, OriginAirport, TripInputs } from "./types";
import { flightHours } from "./flightMatrix";

/** Long-haul threshold (hours) used by the `long_haul_flight` dealbreaker. */
export const LONG_HAUL_HOURS = 9;

export interface FilterContext {
  origin: OriginAirport;
  month: number;
}

/**
 * Apply the trip's HARD constraints (PRD section 7, pipeline step 1):
 * dealbreakers, domestic/international, max flight time, and season.
 */
export function passesHardConstraints(
  destination: Destination,
  inputs: TripInputs,
  ctx: FilterContext,
): boolean {
  const hours = flightHours(ctx.origin.region, destination.region);
  const isDomestic = destination.countryCode === ctx.origin.countryCode;

  // Domestic / international gate.
  if (!inputs.reach.international && !isDomestic) return false;

  // Max flight time.
  if (hours > inputs.reach.maxFlightHours) return false;

  // Season: never recommend a destination during a month it should be avoided.
  if (destination.avoidMonths.includes(ctx.month)) return false;

  // Dealbreakers.
  for (const db of inputs.dealbreakers) {
    if (db === "long_haul_flight" && hours > LONG_HAUL_HOURS) return false;
    if (db === "cold_weather" && destination.climate === "cold") return false;
    if (db === "hot_weather" && destination.climate === "tropical") return false;
    if (db === "big_crowds" && destination.crowded) return false;
  }

  return true;
}

export function filterDestinations(
  destinations: Destination[],
  inputs: TripInputs,
  ctx: FilterContext,
): Destination[] {
  return destinations.filter((d) => passesHardConstraints(d, inputs, ctx));
}
