/**
 * Deterministic PRNG so that "same inputs + same seed -> same 3 picks"
 * (PRD section 8: fair, shareable, testable).
 */

/** Hash an arbitrary string into a 32-bit unsigned integer (xfnv1a). */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** mulberry32: tiny, fast, deterministic generator returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  /** Integer in [0, max). */
  int(max: number): number;
}

export function createRng(seed: string | number): Rng {
  const numeric = typeof seed === "number" ? seed : hashSeed(seed);
  const next = mulberry32(numeric);
  return {
    next,
    int: (max: number) => Math.floor(next() * max),
  };
}
