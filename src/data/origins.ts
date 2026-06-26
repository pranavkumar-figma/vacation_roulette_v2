import type { OriginAirport } from "../engine/types";

/**
 * Curated origin airports for the questionnaire autocomplete.
 *
 * Because this list is curated, the engine can reliably map each IATA code to a
 * region (used by the mock flight-time matrix) and a country (used by the
 * domestic / international gate).
 */
export const ORIGINS: OriginAirport[] = [
  { city: "San Francisco", iata: "SFO", country: "United States", countryCode: "US", region: "us_west" },
  { city: "Los Angeles", iata: "LAX", country: "United States", countryCode: "US", region: "us_west" },
  { city: "Seattle", iata: "SEA", country: "United States", countryCode: "US", region: "us_west" },
  { city: "Denver", iata: "DEN", country: "United States", countryCode: "US", region: "us_central" },
  { city: "Chicago", iata: "ORD", country: "United States", countryCode: "US", region: "us_central" },
  { city: "Dallas", iata: "DFW", country: "United States", countryCode: "US", region: "us_central" },
  { city: "Austin", iata: "AUS", country: "United States", countryCode: "US", region: "us_central" },
  { city: "New York", iata: "JFK", country: "United States", countryCode: "US", region: "us_east" },
  { city: "Boston", iata: "BOS", country: "United States", countryCode: "US", region: "us_east" },
  { city: "Washington, D.C.", iata: "IAD", country: "United States", countryCode: "US", region: "us_east" },
  { city: "Miami", iata: "MIA", country: "United States", countryCode: "US", region: "us_east" },
  { city: "Atlanta", iata: "ATL", country: "United States", countryCode: "US", region: "us_east" },
  { city: "Toronto", iata: "YYZ", country: "Canada", countryCode: "CA", region: "canada" },
  { city: "Vancouver", iata: "YVR", country: "Canada", countryCode: "CA", region: "canada" },
  { city: "London", iata: "LHR", country: "United Kingdom", countryCode: "GB", region: "western_europe" },
  { city: "Paris", iata: "CDG", country: "France", countryCode: "FR", region: "western_europe" },
  { city: "Berlin", iata: "BER", country: "Germany", countryCode: "DE", region: "western_europe" },
  { city: "Madrid", iata: "MAD", country: "Spain", countryCode: "ES", region: "western_europe" },
];

export function findOrigin(iata: string): OriginAirport | undefined {
  return ORIGINS.find((o) => o.iata === iata);
}
