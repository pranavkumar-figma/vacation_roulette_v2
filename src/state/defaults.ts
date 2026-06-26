import { detectDisplayCurrency } from "../engine";
import type { TripInputs } from "../engine/types";

function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Sensible starting inputs (mirrors the PRD wireframe defaults), with dates
 * placed a couple of months out so they're always valid.
 */
export function defaultInputs(): TripInputs {
  return {
    dates: { start: isoOffset(60), end: isoOffset(67), flexDays: 3 },
    origin: { city: "San Francisco", iata: "SFO" },
    partySize: 2,
    composition: "couple",
    vibe: ["relax", "food"],
    budget: {
      amount: 4000,
      currency: detectDisplayCurrency(),
      basis: "total",
      covers: "flights_lodging",
    },
    interests: ["beach", "food"],
    dealbreakers: [],
    reach: { international: true, maxFlightHours: 8 },
  };
}
