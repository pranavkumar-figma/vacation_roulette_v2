import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  SwitchField,
  Tag,
  Text,
  TextContentTitle,
  TextSmall,
} from "primitives";
import { useSession } from "../../state/SessionContext";
import { buildShareUrl, decodeShare } from "../../state/share";
import { PickCard } from "../components/PickCard";
import { NoMatch } from "../components/NoMatch";
import { useDocumentTitle } from "../hooks";

export function Results() {
  const {
    result,
    picks,
    inputs,
    spinIndex,
    reSpin,
    relax,
    loadShare,
    degraded,
    setDegraded,
  } = useSession();
  const navigate = useNavigate();
  useDocumentTitle("Your 3 picks");
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const loadedShare = useRef(false);

  // Load a shared result from the URL exactly once (PRD Q4 shareable link).
  useEffect(() => {
    if (loadedShare.current) return;
    const token = searchParams.get("s");
    if (token) {
      const payload = decodeShare(token);
      if (payload) {
        loadedShare.current = true;
        loadShare(payload.inputs, payload.spinIndex);
        return;
      }
    }
    loadedShare.current = true;
    if (!result) navigate("/spin", { replace: true });
  }, [searchParams, result, loadShare, navigate]);

  if (!result) {
    return (
      <div className="vr-container" style={{ paddingBlock: "var(--sds-size-space-1200)" }}>
        <div className="vr-center">
          <Text>Finding your matches…</Text>
        </div>
      </div>
    );
  }

  if (result.status === "no_match") {
    return <NoMatch suggestions={result.tooTight} />;
  }

  const share = async () => {
    const url = buildShareUrl({ inputs, spinIndex });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your shareable link:", url);
    }
  };

  return (
    <div className="vr-container vr-stack" style={{ paddingBlock: "var(--sds-size-space-800)" }}>
      <div className="vr-row" style={{ justifyContent: "space-between" }}>
        <TextContentTitle title="Your 3 picks" />
        <ButtonGroup>
          <Button variant="neutral" onPress={() => navigate("/plan")}>
            Edit inputs
          </Button>
          <Button variant="primary" onPress={reSpin}>
            Re-spin
          </Button>
        </ButtonGroup>
      </div>

      {result.degraded && (
        <div className="vr-advisory">
          <Text>
            Live prices are temporarily unavailable — costs and flight times below
            are catalog estimates.
          </Text>
        </div>
      )}

      {result.status === "few_matches" && (
        <div className="vr-card vr-card-pad vr-stack" style={{ gap: "var(--sds-size-space-200)" }}>
          <TextSmall>
            Only a few destinations strongly match — extras are labeled{" "}
            <Tag scheme="warning" variant="secondary">Stretch pick</Tag>. Loosen a
            constraint for more:
          </TextSmall>
          <div className="vr-chips">
            {result.tooTight.map((s) => (
              <Button key={s} variant="subtle" size="small" onPress={() => { relax(s); navigate("/spin"); }}>
                {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="vr-picks-grid">
        {picks.map((p) => (
          <PickCard key={p.destination.id} pick={p} />
        ))}
      </div>

      <hr className="vr-divider" />
      <div className="vr-row" style={{ justifyContent: "space-between" }}>
        <div className="vr-row">
          <Button variant="neutral" onPress={share}>
            {copied ? "Link copied!" : "Share these picks"}
          </Button>
        </div>
        <SwitchField isSelected={degraded} onChange={setDegraded}>
          Simulate live-API outage
        </SwitchField>
      </div>
    </div>
  );
}
