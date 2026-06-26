import type { DisplayCurrency, TripInputs } from "./types";
import type { FxProvider } from "./providers";

/** Whole nights between two ISO dates (min 1). */
export function nightsBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/** 1-12 calendar month of the trip start. */
export function travelMonth(inputs: TripInputs): number {
  const d = new Date(inputs.dates.start);
  return Number.isNaN(d.getTime()) ? 1 : d.getMonth() + 1;
}

/** Total budget expressed in USD (engine base), honoring per-person basis. */
export function budgetTotalUsd(inputs: TripInputs, fx: FxProvider): number {
  const totalInCurrency =
    inputs.budget.basis === "per_person"
      ? inputs.budget.amount * inputs.partySize
      : inputs.budget.amount;
  return fx.toUsd(totalInCurrency, inputs.budget.currency);
}

const SUPPORTED: DisplayCurrency[] = ["USD", "EUR", "GBP"];

/** Pick a default display currency from the browser locale (PRD Q2). */
export function detectDisplayCurrency(): DisplayCurrency {
  if (typeof navigator === "undefined") return "USD";
  const locale = navigator.language || "en-US";
  const region = locale.split("-")[1]?.toUpperCase();
  if (region === "GB") return "GBP";
  const eurRegions = ["FR", "DE", "ES", "IT", "NL", "IE", "PT", "AT", "BE", "FI", "GR"];
  if (region && eurRegions.includes(region)) return "EUR";
  return "USD";
}

export function detectLocale(): string {
  if (typeof navigator === "undefined") return "en-US";
  return navigator.language || "en-US";
}

/** Build a money formatter that converts a USD amount to the display currency. */
export function makeMoneyFormatter(
  currency: DisplayCurrency,
  fx: FxProvider,
  locale = detectLocale(),
) {
  const safeCurrency = SUPPORTED.includes(currency) ? currency : "USD";
  const full = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  });
  return {
    /** e.g. "$3,420" */
    format: (usd: number) => full.format(Math.round(fx.fromUsd(usd, safeCurrency))),
    /** Compact form for cards, e.g. "$3.4k" */
    short: (usd: number) => {
      const amount = fx.fromUsd(usd, safeCurrency);
      const compact = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: safeCurrency,
        notation: "compact",
        maximumFractionDigits: 1,
      });
      return compact.format(amount);
    },
  };
}

export function formatDateRange(
  startIso: string,
  endIso: string,
  locale = detectLocale(),
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
