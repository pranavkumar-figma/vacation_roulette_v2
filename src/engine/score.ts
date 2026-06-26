import type {
  Destination,
  Enrichment,
  OriginAirport,
  ScoreBreakdown,
  TripInputs,
} from "./types";
import { flightHours } from "./flightMatrix";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Score weights per factor (sum to 1). */
export const WEIGHTS: ScoreBreakdown = {
  vibe: 0.25,
  interests: 0.2,
  budget: 0.2,
  flightTime: 0.12,
  composition: 0.13,
  season: 0.1,
};

/** Scores at or above this (0..100) are "strong matches". */
export const STRONG_THRESHOLD = 62;

function overlapScore(selected: string[], tags: string[]): number {
  if (selected.length === 0) return 0.6; // neutral when the user didn't specify
  const hits = selected.filter((s) => tags.includes(s)).length;
  return clamp01(hits / selected.length);
}

function budgetFit(totalUsd: number, budgetTotalUsd: number): number {
  if (budgetTotalUsd <= 0) return 0.6;
  const ratio = totalUsd / budgetTotalUsd;
  if (ratio <= 1) return clamp01(0.85 + 0.15 * ratio); // near budget is ideal
  return clamp01(1 - (ratio - 1) * 1.5); // over budget penalized steeply
}

function flightFit(hours: number, maxHours: number): number {
  if (maxHours <= 0) return 0.5;
  return clamp01(1 - (Math.min(hours, maxHours) / maxHours) * 0.4);
}

function compositionFit(destination: Destination, inputs: TripInputs): number {
  const has = (v: string) => destination.vibes.includes(v as never);
  switch (inputs.composition) {
    case "family":
      return clamp01(0.3 + destination.familyFriendly * 0.7);
    case "couple":
      return clamp01(0.7 + (has("romance") ? 0.3 : 0));
    case "solo":
      return clamp01(0.72 + (has("adventure") || has("culture") ? 0.2 : 0));
    case "friends":
      return clamp01(0.68 + (has("party") || has("nightlife" as never) ? 0.3 : 0.05));
    case "mixed":
      return clamp01(0.6 + destination.familyFriendly * 0.3);
    default:
      return 0.7;
  }
}

function seasonFit(destination: Destination, month: number): number {
  if (destination.bestMonths.includes(month)) return 1;
  if (destination.avoidMonths.includes(month)) return 0.3;
  return 0.7;
}

export interface ScoreArgs {
  destination: Destination;
  enrichment: Enrichment;
  inputs: TripInputs;
  origin: OriginAirport;
  budgetTotalUsd: number;
  month: number;
}

export function scoreDestination(args: ScoreArgs): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const { destination, enrichment, inputs, origin, budgetTotalUsd, month } =
    args;
  const hours = flightHours(origin.region, destination.region);

  const breakdown: ScoreBreakdown = {
    vibe: overlapScore(inputs.vibe, destination.vibes),
    interests: overlapScore(inputs.interests, destination.interests),
    budget: budgetFit(enrichment.totalUsd, budgetTotalUsd),
    flightTime: flightFit(hours, inputs.reach.maxFlightHours),
    composition: compositionFit(destination, inputs),
    season: seasonFit(destination, month),
  };

  const weighted =
    breakdown.vibe * WEIGHTS.vibe +
    breakdown.interests * WEIGHTS.interests +
    breakdown.budget * WEIGHTS.budget +
    breakdown.flightTime * WEIGHTS.flightTime +
    breakdown.composition * WEIGHTS.composition +
    breakdown.season * WEIGHTS.season;

  return { score: Math.round(weighted * 100), breakdown };
}
