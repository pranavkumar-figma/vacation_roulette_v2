# Vacation Roulette

Answer 8 quick questions, spin, and get 3 destination picks tuned to your dates,
origin, group, budget, and vibe. The spin is delight-driven but constrained: it
only lands on top-matching destinations, so every result is realistic.

Built on the [Figma Simple Design System (SDS)](https://github.com/figma/sds)
(React + TypeScript + Vite). This is a **mock-first MVP**: it runs end-to-end
locally with **no API keys**. The recommendation engine blends a curated dataset
with deterministic scoring and a templated rationale, behind provider interfaces
that real services (Duffel, Unsplash, an FX-rates API, an LLM) can implement in
Phase 2 without touching the rest of the app.

Source of truth for product decisions: the FigJam PRD
(`file_key 5fWKWaOK3oukKjDqJUuhpI`).

## Getting started

```bash
npm install
npm run app:dev      # http://localhost:8000
```

Other scripts:

```bash
npm run app:build    # type-check + production build
npm run app:lint     # eslint (max-warnings 0)
npm run storybook    # SDS component explorer
```

## How it works

```
Landing → Questionnaire (8 inputs) → [valid?] → Recommendation engine
        → scored shortlist (top matches) → Roulette spin → 3 picks + rationale
        → Destination detail + outbound links
```

The engine pipeline (PRD section 7):

1. **Filter** the catalog by hard constraints (dealbreakers, domestic/intl, max
   flight time, season).
2. **Enrich** survivors with flight/lodging estimates (mock providers).
3. **Score** by vibe + interests, budget, flight-time, composition, and season
   fit.
4. **Shortlist** the top ~10.
5. **Spin** the roulette across that shortlist only, resolving to 3 picks.

The spin is deterministic: the same inputs + seed always produce the same 3
picks (fair, shareable, testable), and re-spin advances the seed for a different
3. Reduced-motion is respected, and the animation is skippable.

## Project structure

| Path | What |
| --- | --- |
| `src/engine/` | Pure recommendation engine: `types`, `filter`, `score`, `shortlist` (in `index`), `rationale`, `seededRng`, `providers`, `format`, `links` |
| `src/data/` | Curated `destinations.ts` catalog (~40) and `origins.ts` airports |
| `src/state/` | Session store (`SessionContext`), `defaults`, `validation`, and shareable-URL `share` |
| `src/app/` | Screens (`Landing`, `Questionnaire`, `Spin`, `Results`, `DestinationDetail`), components, and `app.css` (SDS tokens only) |
| `src/ui/`, `src/theme.css` | The vendored SDS primitives, compositions, layout, and design tokens |
| `scripts/selfcheck.ts` | Engine self-check (determinism, share round-trip, degraded, no-match) |

## Swapping in real services (Phase 2)

Implement these interfaces in `src/engine/providers.ts` (move secrets
server-side):

- `FlightProvider` / `LodgingProvider` → Duffel (+ Travelpayouts affiliate links
  in `src/engine/links.ts`)
- image source → Unsplash API (store attribution per destination)
- `FxProvider` → a daily FX-rates API
- the templated `generateRationale` → an LLM `Ranker`

Everything else (filtering, scoring, the roulette, the UI) stays the same.

## Notes

Prices, flight times, and imagery are estimates in this build; verify before
booking. No accounts, payments, or live bookings (link-out only) per the MVP
scope.
