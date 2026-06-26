import type { TripInputs } from "../engine/types";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Validate trip inputs (PRD section 11 edge cases). */
export function validateInputs(inputs: TripInputs): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  const start = new Date(inputs.dates.start).getTime();
  const end = new Date(inputs.dates.end).getTime();

  if (!inputs.dates.start || Number.isNaN(start)) {
    errors.dates = "Pick a start date.";
  } else if (start < startOfToday()) {
    errors.dates = "Start date can't be in the past.";
  } else if (!inputs.dates.end || Number.isNaN(end)) {
    errors.dates = "Pick an end date.";
  } else if (end <= start) {
    errors.dates = "End date must be after the start date.";
  }

  if (!inputs.origin.iata) {
    errors.origin = "Choose where you're leaving from.";
  }

  if (!Number.isFinite(inputs.partySize) || inputs.partySize < 1) {
    errors.partySize = "At least one traveler is required.";
  }

  if (!Number.isFinite(inputs.budget.amount) || inputs.budget.amount <= 0) {
    errors.budget = "Set a budget above zero.";
  }

  if (inputs.reach.maxFlightHours <= 0) {
    errors.reach = "Allow at least some flight time.";
  }

  // Non-blocking conflict surfaced before scoring (PRD edge cases).
  if (inputs.reach.international && inputs.reach.maxFlightHours < 5) {
    warnings.reach =
      "Most international trips need more than 5h of flight time — you may only see nearby options.";
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}
