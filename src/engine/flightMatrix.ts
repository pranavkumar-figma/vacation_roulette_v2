import type { Region } from "./types";

/**
 * Approximate nonstop flight hours between regions, used by the mock flight
 * provider. Values are intentionally coarse - they only need to be plausible
 * and consistent so scoring and the domestic/international gate behave sensibly.
 * A real build (Duffel) replaces this entirely (PRD section 7).
 */
const HOURS: Partial<Record<Region, Partial<Record<Region, number>>>> = {
  us_west: {
    us_west: 1.5,
    us_central: 3,
    us_east: 5.5,
    canada: 4,
    mexico_central_america: 4.5,
    caribbean: 7,
    south_america: 10,
    western_europe: 11,
    eastern_europe: 13,
    north_africa: 13,
    subsaharan_africa: 18,
    middle_east: 16,
    south_asia: 17,
    southeast_asia: 16,
    east_asia: 11,
    oceania: 13,
  },
  us_central: {
    us_west: 3,
    us_central: 1.5,
    us_east: 2.5,
    canada: 2.5,
    mexico_central_america: 3.5,
    caribbean: 4,
    south_america: 8,
    western_europe: 9,
    eastern_europe: 11,
    north_africa: 11,
    subsaharan_africa: 16,
    middle_east: 14,
    south_asia: 15,
    southeast_asia: 18,
    east_asia: 13,
    oceania: 17,
  },
  us_east: {
    us_west: 5.5,
    us_central: 2.5,
    us_east: 1.5,
    canada: 1.5,
    mexico_central_america: 4,
    caribbean: 3.5,
    south_america: 7,
    western_europe: 7.5,
    eastern_europe: 9.5,
    north_africa: 8.5,
    subsaharan_africa: 15,
    middle_east: 11,
    south_asia: 14,
    southeast_asia: 18,
    east_asia: 14,
    oceania: 20,
  },
  canada: {
    us_west: 4,
    us_central: 2.5,
    us_east: 1.5,
    canada: 1.5,
    mexico_central_america: 5,
    caribbean: 5,
    south_america: 9,
    western_europe: 7,
    eastern_europe: 9,
    north_africa: 8,
    subsaharan_africa: 15,
    middle_east: 11,
    south_asia: 13,
    southeast_asia: 16,
    east_asia: 11,
    oceania: 15,
  },
  western_europe: {
    us_west: 11,
    us_central: 9,
    us_east: 7.5,
    canada: 7,
    mexico_central_america: 11,
    caribbean: 9,
    south_america: 11,
    western_europe: 1.5,
    eastern_europe: 3,
    north_africa: 3,
    subsaharan_africa: 11,
    middle_east: 5,
    south_asia: 8,
    southeast_asia: 12,
    east_asia: 11,
    oceania: 22,
  },
  eastern_europe: {
    us_west: 13,
    us_central: 11,
    us_east: 9.5,
    canada: 9,
    western_europe: 3,
    eastern_europe: 1.5,
    north_africa: 3,
    middle_east: 3,
    south_asia: 7,
    southeast_asia: 11,
    east_asia: 10,
    oceania: 20,
    mexico_central_america: 13,
    caribbean: 12,
    south_america: 13,
    subsaharan_africa: 10,
  },
};

/** Mirror lookups when the origin region isn't a key above. */
const FALLBACK_BY_REGION: Record<Region, number> = {
  us_west: 12,
  us_east: 11,
  us_central: 12,
  canada: 11,
  mexico_central_america: 6,
  caribbean: 7,
  south_america: 10,
  western_europe: 9,
  eastern_europe: 11,
  north_africa: 10,
  subsaharan_africa: 16,
  middle_east: 13,
  south_asia: 15,
  southeast_asia: 17,
  east_asia: 13,
  oceania: 17,
};

export function flightHours(from: Region, to: Region): number {
  const direct = HOURS[from]?.[to];
  if (direct != null) return direct;
  // Try the reverse (symmetric assumption).
  const reverse = HOURS[to]?.[from];
  if (reverse != null) return reverse;
  return FALLBACK_BY_REGION[to];
}
