import type { Destination, OriginAirport, TripInputs } from "./types";

/**
 * Outbound deep links (PRD section 9 + integration stack).
 *
 * The MVP links out to provider search pages so users can book without us
 * handling payment. In production these are wrapped with Travelpayouts affiliate
 * parameters; the wrapping happens here so callers never change.
 */

function isoDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function flightsUrl(
  origin: OriginAirport,
  destination: Destination,
  inputs: TripInputs,
): string {
  const q = `Flights from ${origin.iata} to ${destination.name} on ${isoDate(
    inputs.dates.start,
  )} through ${isoDate(inputs.dates.end)}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

export function staysUrl(
  destination: Destination,
  inputs: TripInputs,
): string {
  const params = new URLSearchParams({
    ss: `${destination.name}, ${destination.country}`,
    checkin: isoDate(inputs.dates.start),
    checkout: isoDate(inputs.dates.end),
    group_adults: String(inputs.partySize),
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

/** Non-blocking entry-requirements advisory link (PRD Q5). */
export function visaInfoUrl(destination: Destination): string {
  const q = `${destination.country} entry requirements for travelers`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
