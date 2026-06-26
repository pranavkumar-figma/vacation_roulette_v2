import type { Destination, Enrichment, OriginAirport, TripInputs } from "./types";
import { flightHours } from "./flightMatrix";

/**
 * Provider seams (PRD section 7, sources #2 and #3 + imagery/FX).
 *
 * MVP ships deterministic Mock* implementations so the app runs end-to-end with
 * no API keys. Real implementations (Duffel for flights/stays, Unsplash for
 * imagery, a daily FX-rates API) implement these same interfaces server-side in
 * Phase 2 - nothing else in the engine has to change.
 */

export interface FlightQuote {
  hours: number;
  priceUsd: number;
  estimated: boolean;
}

export interface LodgingQuote {
  nightlyUsd: number;
  priceUsd: number;
  estimated: boolean;
}

export interface FlightProvider {
  quote(args: {
    origin: OriginAirport;
    destination: Destination;
    nights: number;
    partySize: number;
    month: number;
  }): FlightQuote;
}

export interface LodgingProvider {
  quote(args: {
    destination: Destination;
    nights: number;
    partySize: number;
    month: number;
  }): LodgingQuote;
}

export interface FxProvider {
  /** Convert an amount in `currency` into USD (engine's base currency). */
  toUsd(amount: number, currency: string): number;
  /** Convert a USD amount into the display `currency`. */
  fromUsd(amountUsd: number, currency: string): number;
}

const NIGHTLY_BY_TIER: Record<number, number> = {
  1: 60,
  2: 110,
  3: 180,
  4: 300,
  5: 460,
};

/** Static daily USD->X rates for the supported display currencies (PRD Q2). */
const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
};

function seasonMultiplier(destination: Destination, month: number): number {
  if (destination.bestMonths.includes(month)) return 1.12;
  if (destination.avoidMonths.includes(month)) return 0.85;
  return 1;
}

export class MockFlightProvider implements FlightProvider {
  constructor(private degraded = false) {}
  quote({
    origin,
    destination,
    partySize,
    month,
  }: {
    origin: OriginAirport;
    destination: Destination;
    nights: number;
    partySize: number;
    month: number;
  }): FlightQuote {
    const hours = flightHours(origin.region, destination.region);
    const perSeat = (130 + hours * 58) * seasonMultiplier(destination, month);
    return {
      hours: Math.round(hours * 10) / 10,
      priceUsd: Math.round((perSeat * partySize) / 10) * 10,
      estimated: this.degraded,
    };
  }
}

export class MockLodgingProvider implements LodgingProvider {
  constructor(private degraded = false) {}
  quote({
    destination,
    nights,
    partySize,
    month,
  }: {
    destination: Destination;
    nights: number;
    partySize: number;
    month: number;
  }): LodgingQuote {
    const rooms = Math.max(1, Math.ceil(partySize / 2));
    const nightly =
      NIGHTLY_BY_TIER[destination.costTier] *
      rooms *
      seasonMultiplier(destination, month);
    return {
      nightlyUsd: Math.round(nightly),
      priceUsd: Math.round((nightly * nights) / 10) * 10,
      estimated: this.degraded,
    };
  }
}

export class MockFxProvider implements FxProvider {
  toUsd(amount: number, currency: string): number {
    const rate = FX_RATES[currency] ?? 1;
    return amount / rate;
  }
  fromUsd(amountUsd: number, currency: string): number {
    const rate = FX_RATES[currency] ?? 1;
    return amountUsd * rate;
  }
}

export interface Providers {
  flight: FlightProvider;
  lodging: LodgingProvider;
  fx: FxProvider;
  /** True when any provider is degraded to estimates (PRD fallback). */
  degraded: boolean;
}

export function createMockProviders(degraded = false): Providers {
  return {
    flight: new MockFlightProvider(degraded),
    lodging: new MockLodgingProvider(degraded),
    fx: new MockFxProvider(),
    degraded,
  };
}

/** Build the trip-cost enrichment relevant to the user's budget basis. */
export function enrich(
  destination: Destination,
  inputs: TripInputs,
  origin: OriginAirport,
  nights: number,
  providers: Providers,
): Enrichment {
  const month = new Date(inputs.dates.start).getMonth() + 1;
  const flight = providers.flight.quote({
    origin,
    destination,
    nights,
    partySize: inputs.partySize,
    month,
  });
  const lodging = providers.lodging.quote({
    destination,
    nights,
    partySize: inputs.partySize,
    month,
  });

  // On-ground buffer scales with cost tier, party and length of trip.
  const onGroundPerPersonDay = 40 + destination.costTier * 18;
  const onGround = onGroundPerPersonDay * inputs.partySize * Math.max(1, nights);

  const totalUsd =
    inputs.budget.covers === "on_ground"
      ? onGround
      : flight.priceUsd + lodging.priceUsd;

  return {
    flight,
    lodging,
    totalUsd: Math.round(totalUsd / 10) * 10,
  };
}
