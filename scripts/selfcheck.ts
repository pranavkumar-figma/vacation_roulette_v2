import { recommend, spin, spinSeed } from "../src/engine";
import { describeDestination } from "../src/engine";
import { defaultInputs } from "../src/state/defaults";
import { encodeShare, decodeShare } from "../src/state/share";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log("ok:", msg);
}

const inputs = defaultInputs();
const result = recommend(inputs);
assert(result.shortlist.length > 0, `shortlist populated (${result.shortlist.length})`);
assert(result.status === "ok" || result.status === "few_matches", `status=${result.status}`);

const seed0 = spinSeed(inputs, 0);
const a = spin(result.shortlist, inputs, seed0);
const b = spin(result.shortlist, inputs, seed0);
assert(a.length === 3, `spin returns 3 picks (${a.length})`);
assert(
  a.map((p) => p.destination.id).join(",") === b.map((p) => p.destination.id).join(","),
  "same inputs + seed -> identical 3 picks",
);

const c = spin(result.shortlist, inputs, spinSeed(inputs, 1));
assert(
  a.map((p) => p.destination.id).join(",") !== c.map((p) => p.destination.id).join(","),
  "re-spin (new seed) -> different 3 picks",
);

// Share round-trip.
const token = encodeShare({ inputs, spinIndex: 0 });
const decoded = decodeShare(token);
assert(!!decoded, "share token decodes");
assert(JSON.stringify(decoded?.inputs) === JSON.stringify(inputs), "share round-trips inputs");

// Degraded fallback marks estimates.
const degraded = recommend(inputs, { degraded: true });
assert(degraded.degraded === true, "degraded flag set");
assert(degraded.shortlist[0].enrichment.flight.estimated === true, "degraded marks flight estimated");

// No-match path: impossible constraints.
const tight = recommend({
  ...inputs,
  reach: { international: false, maxFlightHours: 1 },
});
assert(tight.status === "no_match", `tight constraints -> no_match (${tight.status})`);
assert(tight.tooTight.length > 0, "no_match returns relax suggestions");

// Detail describe works for a known id.
const desc = describeDestination(result.shortlist[0].destination.id, inputs);
assert(!!desc && desc.rationale.length > 0, "describeDestination returns rationale");

console.log("\nAll self-checks passed.");
