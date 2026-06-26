import type {
  Destination,
  Enrichment,
  OriginAirport,
  ScoreBreakdown,
  TripInputs,
} from "./types";

/**
 * Templated "Why this fits" generator (the MVP's AI layer, PRD section 7 #3).
 *
 * It reads the per-factor score breakdown and composes a 1-2 sentence rationale.
 * Swappable for a real LLM behind the same call signature in Phase 2.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function list(items: string[]): string {
  const pretty = items.map((i) => i.replace(/_/g, " "));
  if (pretty.length === 0) return "";
  if (pretty.length === 1) return pretty[0];
  if (pretty.length === 2) return `${pretty[0]} and ${pretty[1]}`;
  return `${pretty.slice(0, -1).join(", ")}, and ${pretty[pretty.length - 1]}`;
}

export interface RationaleArgs {
  destination: Destination;
  enrichment: Enrichment;
  breakdown: ScoreBreakdown;
  inputs: TripInputs;
  origin: OriginAirport;
  budgetTotalUsd: number;
  month: number;
  /** Formats a USD amount into the user's display currency string. */
  formatMoney: (usd: number) => string;
}

export function generateRationale(args: RationaleArgs): string {
  const {
    destination,
    enrichment,
    inputs,
    origin,
    budgetTotalUsd,
    month,
    formatMoney,
  } = args;

  const sentences: string[] = [];

  // Sentence 1: vibe + interests fit.
  const matchedVibes = inputs.vibe.filter((v) => destination.vibes.includes(v));
  const vibeText = list(
    (matchedVibes.length ? matchedVibes : destination.vibes).slice(0, 3),
  );
  const matchedInterests = inputs.interests.filter((i) =>
    destination.interests.includes(i),
  );
  let s1 = `${destination.name} leans right into your ${vibeText} vibe`;
  if (matchedInterests.length) {
    s1 += `, with the ${list(matchedInterests)} you flagged as must-haves`;
  }
  s1 += ".";
  sentences.push(s1);

  // Sentence 2: practical fit (flight, budget, timing).
  const parts: string[] = [];
  const hours = enrichment.flight.hours;
  parts.push(
    `It's about ${hours}h from ${origin.city}, within your ${inputs.reach.maxFlightHours}h limit`,
  );

  const total = enrichment.totalUsd;
  if (total <= budgetTotalUsd) {
    parts.push(
      `and the estimated ${formatMoney(total)} sits inside your ${formatMoney(budgetTotalUsd)} budget`,
    );
  } else {
    parts.push(
      `and while the ${formatMoney(total)} estimate runs over your ${formatMoney(budgetTotalUsd)} budget, the fit is strong`,
    );
  }

  let s2 = parts.join(", ");
  if (destination.bestMonths.includes(month)) {
    s2 += `. ${MONTHS[month - 1]} is also peak season there`;
  }
  s2 += ".";
  sentences.push(s2);

  return sentences.join(" ");
}
