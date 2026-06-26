import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { recommend, spin, spinSeed } from "../engine";
import type {
  EngineResult,
  Pick,
  RelaxSuggestion,
  TripInputs,
} from "../engine/types";
import { defaultInputs } from "./defaults";

const STORAGE_KEY = "vacation-roulette-session";

interface SessionState {
  inputs: TripInputs;
  result: EngineResult | null;
  picks: Pick[];
  spinIndex: number;
  saved: Pick[];
  /** Simulates the live-API-degraded fallback (PRD) for demo/testing. */
  degraded: boolean;
}

type Action =
  | { type: "SET_INPUTS"; inputs: TripInputs }
  | { type: "RUN" }
  | { type: "RESPIN" }
  | { type: "TOGGLE_SAVE"; pick: Pick }
  | { type: "SET_DEGRADED"; value: boolean }
  | { type: "LOAD_SHARE"; inputs: TripInputs; spinIndex: number };

function compute(inputs: TripInputs, degraded: boolean, spinIndex: number) {
  const result = recommend(inputs, { degraded });
  const picks = spin(result.shortlist, inputs, spinSeed(inputs, spinIndex));
  return { result, picks };
}

function applyRelax(inputs: TripInputs, s: RelaxSuggestion): TripInputs {
  switch (s) {
    case "widen_budget":
      return {
        ...inputs,
        budget: { ...inputs.budget, amount: Math.round(inputs.budget.amount * 1.5) },
      };
    case "more_flex_days":
      return {
        ...inputs,
        dates: { ...inputs.dates, flexDays: inputs.dates.flexDays + 3 },
      };
    case "more_flight_time":
      return {
        ...inputs,
        reach: { ...inputs.reach, maxFlightHours: inputs.reach.maxFlightHours + 6 },
      };
    case "allow_international":
      return { ...inputs, reach: { ...inputs.reach, international: true } };
    default:
      return inputs;
  }
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "SET_INPUTS":
      return { ...state, inputs: action.inputs };
    case "RUN": {
      const { result, picks } = compute(state.inputs, state.degraded, 0);
      return { ...state, result, picks, spinIndex: 0 };
    }
    case "RESPIN": {
      const nextIndex = state.spinIndex + 1;
      const result = state.result ?? recommend(state.inputs, { degraded: state.degraded });
      const picks = spin(result.shortlist, state.inputs, spinSeed(state.inputs, nextIndex));
      return { ...state, result, picks, spinIndex: nextIndex };
    }
    case "TOGGLE_SAVE": {
      const id = action.pick.destination.id;
      const exists = state.saved.some((p) => p.destination.id === id);
      return {
        ...state,
        saved: exists
          ? state.saved.filter((p) => p.destination.id !== id)
          : [...state.saved, action.pick],
      };
    }
    case "SET_DEGRADED": {
      if (action.value === state.degraded) return { ...state, degraded: action.value };
      const next = { ...state, degraded: action.value };
      if (state.result) {
        const { result, picks } = compute(state.inputs, action.value, state.spinIndex);
        return { ...next, result, picks };
      }
      return next;
    }
    case "LOAD_SHARE": {
      const { result, picks } = compute(action.inputs, state.degraded, action.spinIndex);
      return { ...state, inputs: action.inputs, result, picks, spinIndex: action.spinIndex };
    }
    default:
      return state;
  }
}

function init(): SessionState {
  const base: SessionState = {
    inputs: defaultInputs(),
    result: null,
    picks: [],
    spinIndex: 0,
    saved: [],
    degraded: false,
  };
  if (typeof sessionStorage === "undefined") return base;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<SessionState>;
    return {
      ...base,
      inputs: saved.inputs ?? base.inputs,
      spinIndex: saved.spinIndex ?? 0,
      saved: saved.saved ?? [],
      degraded: saved.degraded ?? false,
    };
  } catch {
    return base;
  }
}

interface SessionContextValue extends SessionState {
  setInputs: (inputs: TripInputs) => void;
  run: () => void;
  reSpin: () => void;
  relax: (s: RelaxSuggestion) => void;
  toggleSave: (pick: Pick) => void;
  isSaved: (id: string) => boolean;
  setDegraded: (value: boolean) => void;
  loadShare: (inputs: TripInputs, spinIndex: number) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          inputs: state.inputs,
          spinIndex: state.spinIndex,
          saved: state.saved,
          degraded: state.degraded,
        }),
      );
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [state.inputs, state.spinIndex, state.saved, state.degraded]);

  const setInputs = useCallback((inputs: TripInputs) => dispatch({ type: "SET_INPUTS", inputs }), []);
  const run = useCallback(() => dispatch({ type: "RUN" }), []);
  const reSpin = useCallback(() => dispatch({ type: "RESPIN" }), []);
  const relax = useCallback(
    (s: RelaxSuggestion) => {
      dispatch({ type: "SET_INPUTS", inputs: applyRelax(state.inputs, s) });
      dispatch({ type: "RUN" });
    },
    [state.inputs],
  );
  const toggleSave = useCallback((pick: Pick) => dispatch({ type: "TOGGLE_SAVE", pick }), []);
  const isSaved = useCallback(
    (id: string) => state.saved.some((p) => p.destination.id === id),
    [state.saved],
  );
  const setDegraded = useCallback((value: boolean) => dispatch({ type: "SET_DEGRADED", value }), []);
  const loadShare = useCallback(
    (inputs: TripInputs, spinIndex: number) =>
      dispatch({ type: "LOAD_SHARE", inputs, spinIndex }),
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      setInputs,
      run,
      reSpin,
      relax,
      toggleSave,
      isSaved,
      setDegraded,
      loadShare,
    }),
    [state, setInputs, run, reSpin, relax, toggleSave, isSaved, setDegraded, loadShare],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
