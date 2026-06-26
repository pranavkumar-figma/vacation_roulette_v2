import { useNavigate } from "react-router-dom";
import { Button, Text, TextContentTitle } from "primitives";
import type { RelaxSuggestion } from "../../engine/types";
import { useSession } from "../../state/SessionContext";

const LABELS: Record<RelaxSuggestion, string> = {
  widen_budget: "Widen budget",
  more_flex_days: "Allow ±3 more days",
  more_flight_time: "More flight time",
  allow_international: "Allow international",
};

export function NoMatch({ suggestions }: { suggestions: RelaxSuggestion[] }) {
  const { relax } = useSession();
  const navigate = useNavigate();

  const apply = (s: RelaxSuggestion) => {
    relax(s);
    navigate("/spin");
  };

  return (
    <div className="vr-container" style={{ paddingBlock: "var(--sds-size-space-1200)" }}>
      <div className="vr-center">
        <TextContentTitle
          align="center"
          title="No strong matches yet"
          subtitle="Loosen one constraint to open up options:"
        />
        <div className="vr-chips" style={{ justifyContent: "center" }}>
          {suggestions.map((s) => (
            <Button key={s} variant="neutral" size="small" onPress={() => apply(s)}>
              {LABELS[s]}
            </Button>
          ))}
        </div>
        <Text className="vr-muted">
          Or tweak your answers directly for the biggest change.
        </Text>
        <Button variant="primary" onPress={() => navigate("/plan")}>
          Edit my answers
        </Button>
      </div>
    </div>
  );
}
