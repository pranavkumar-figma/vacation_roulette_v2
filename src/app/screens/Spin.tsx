import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Text, TextContentTitle } from "primitives";
import { useSession } from "../../state/SessionContext";
import { usePrefersReducedMotion, useDocumentTitle } from "../hooks";
import { RouletteWheel } from "../components/RouletteWheel";

const SPIN_MS = 2200;

export function Spin() {
  const { result, run } = useSession();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [spinning, setSpinning] = useState(true);
  useDocumentTitle("Spinning the roulette…");

  // Ensure a result exists even on direct navigation / refresh.
  useEffect(() => {
    if (!result) run();
  }, [result, run]);

  useEffect(() => {
    if (!result) return;
    if (result.status === "no_match") {
      navigate("/results", { replace: true });
      return;
    }
    const delay = reduced ? 0 : SPIN_MS;
    const timer = setTimeout(() => {
      setSpinning(false);
      navigate("/results");
    }, delay);
    return () => clearTimeout(timer);
  }, [result, reduced, navigate]);

  const items = result?.shortlist.map((s) => s.destination.name) ?? [];

  return (
    <div className="vr-container" style={{ paddingBlock: "var(--sds-size-space-1200)" }}>
      <div className="vr-center vr-wheel-wrap">
        <TextContentTitle align="center" title="Spinning the roulette…" />
        <RouletteWheel items={items} spinning={spinning && !reduced} />
        <Text className="vr-muted">
          Lands only on your top matches — so every result fits.
        </Text>
        <Button variant="subtle" onPress={() => navigate("/results")}>
          Skip animation
        </Button>
      </div>
    </div>
  );
}
