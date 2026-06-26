import type { TripInputs } from "../engine/types";

/**
 * Shareable result link (PRD Q4): the URL encodes the inputs + the spin index.
 * Because the engine is deterministic ("same inputs + seed -> same 3"), that is
 * enough to reproduce the exact same 3 picks on another device with no account.
 */

export interface SharePayload {
  inputs: TripInputs;
  spinIndex: number;
}

interface SerializedShare {
  v: 1;
  i: TripInputs;
  s: number;
}

function toBase64Url(json: string): string {
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeShare(payload: SharePayload): string {
  const data: SerializedShare = {
    v: 1,
    i: payload.inputs,
    s: payload.spinIndex,
  };
  return toBase64Url(JSON.stringify(data));
}

export function decodeShare(token: string): SharePayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as SerializedShare;
    if (!parsed || parsed.v !== 1 || !parsed.i) return null;
    return { inputs: parsed.i, spinIndex: parsed.s ?? 0 };
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the current origin. */
export function buildShareUrl(payload: SharePayload): string {
  const token = encodeShare(payload);
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  return `${base}#/results?s=${token}`;
}
