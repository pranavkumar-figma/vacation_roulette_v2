/**
 * Domain types for Vacation Roulette.
 *
 * `TripInputs` mirrors the PRD section 6 "Input data model" verbatim in shape,
 * so the questionnaire, engine, and shareable URL all speak the same language.
 */

export const VIBES = [
  "relax",
  "adventure",
  "party",
  "culture",
  "nature",
  "romance",
  "food",
] as const;
export type Vibe = (typeof VIBES)[number];

export const INTERESTS = [
  "beach",
  "mountains",
  "nightlife",
  "food",
  "museums",
  "nature",
  "shopping",
  "history",
] as const;
export type Interest = (typeof INTERESTS)[number];

export const DEALBREAKERS = [
  "long_haul_flight",
  "cold_weather",
  "hot_weather",
  "big_crowds",
] as const;
export type Dealbreaker = (typeof DEALBREAKERS)[number];

export const COMPOSITIONS = [
  "solo",
  "couple",
  "family",
  "friends",
  "mixed",
] as const;
export type Composition = (typeof COMPOSITIONS)[number];

export type BudgetBasis = "total" | "per_person";
export type BudgetCovers = "flights_lodging" | "on_ground";

export type DisplayCurrency = "USD" | "EUR" | "GBP";

export interface TripInputs {
  dates: {
    /** ISO date string, e.g. "2026-09-12" */
    start: string;
    /** ISO date string, e.g. "2026-09-19" */
    end: string;
    /** "flexible +/- N days" toggle; 0 means fixed */
    flexDays: number;
  };
  origin: {
    city: string;
    iata: string;
  };
  partySize: number;
  composition: Composition;
  vibe: Vibe[];
  budget: {
    amount: number;
    currency: DisplayCurrency;
    basis: BudgetBasis;
    covers: BudgetCovers;
  };
  interests: Interest[];
  dealbreakers: Dealbreaker[];
  reach: {
    international: boolean;
    maxFlightHours: number;
  };
}

/** Coarse geographic regions used for the mock flight-time matrix. */
export const REGIONS = [
  "us_west",
  "us_east",
  "us_central",
  "canada",
  "mexico_central_america",
  "caribbean",
  "south_america",
  "western_europe",
  "eastern_europe",
  "north_africa",
  "subsaharan_africa",
  "middle_east",
  "south_asia",
  "southeast_asia",
  "east_asia",
  "oceania",
] as const;
export type Region = (typeof REGIONS)[number];

/** Relative price level of a destination, 1 (cheap) .. 5 (very expensive). */
export type CostTier = 1 | 2 | 3 | 4 | 5;

/** A curated catalog destination. */
export interface Destination {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region;
  /** Nearest major airport IATA code. */
  iata: string;
  vibes: Vibe[];
  interests: Interest[];
  /** Calendar months (1-12) when the destination is at its best. */
  bestMonths: number[];
  /** Calendar months (1-12) to avoid (monsoon, extreme heat/cold, etc.). */
  avoidMonths: number[];
  /** 0 (not suitable) .. 1 (great for kids). */
  familyFriendly: number;
  costTier: CostTier;
  /** Typical daytime climate during the destination's peak season. */
  climate: "tropical" | "warm" | "temperate" | "cold";
  /** Tends to be busy / crowded with tourists. */
  crowded: boolean;
  /** Short tagline shown on cards. */
  tagline: string;
  image: {
    url: string;
    /** Attribution string stored per PRD Q3 (Unsplash terms). */
    attribution: string;
    /** "placeholder" in the mock build; "unsplash"/"pexels" once wired up. */
    source: "unsplash" | "pexels" | "placeholder";
  };
}

/** An origin airport offered by the questionnaire autocomplete. */
export interface OriginAirport {
  city: string;
  iata: string;
  country: string;
  countryCode: string;
  region: Region;
}

/** Live (here: mocked) enrichment for a destination given the trip. */
export interface Enrichment {
  flight: {
    hours: number;
    /** Round-trip price in USD for the whole party. */
    priceUsd: number;
    estimated: boolean;
  };
  lodging: {
    /** Total lodging price in USD for the stay. */
    priceUsd: number;
    nightlyUsd: number;
    estimated: boolean;
  };
  /** Total trip estimate in USD (flights + lodging + on-ground buffer). */
  totalUsd: number;
}

/** Per-factor scores (0..1) used both for ranking and rationale copy. */
export interface ScoreBreakdown {
  vibe: number;
  interests: number;
  budget: number;
  flightTime: number;
  composition: number;
  season: number;
}

export interface ScoredDestination {
  destination: Destination;
  enrichment: Enrichment;
  /** Weighted total, 0..100. */
  score: number;
  breakdown: ScoreBreakdown;
  /** True when score clears the "strong match" threshold. */
  strong: boolean;
}

/** A destination chosen by the roulette, plus its generated rationale. */
export interface Pick extends ScoredDestination {
  rationale: string;
  /** Set when this pick was included only to reach 3 (PRD "stretch picks"). */
  stretch: boolean;
}

export type EngineStatus = "ok" | "no_match" | "few_matches";

export interface EngineResult {
  status: EngineStatus;
  /** Full scored shortlist the roulette may spin across (top N). */
  shortlist: ScoredDestination[];
  /** True if any provider degraded to estimates (PRD fallback). */
  degraded: boolean;
  /** Constraint hints to relax when status is no_match. */
  tooTight: RelaxSuggestion[];
}

export type RelaxSuggestion =
  | "widen_budget"
  | "more_flex_days"
  | "more_flight_time"
  | "allow_international";
