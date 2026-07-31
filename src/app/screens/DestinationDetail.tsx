import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Text,
  TextContentTitle,
  TextSmall,
  TextStrong,
} from "primitives";
import {
  describeDestination,
  flightsUrl,
  resolveOrigin,
  staysUrl,
  visaInfoUrl,
} from "../../engine";
import { useSession } from "../../state/SessionContext";
import { useFormatters } from "../useFormatters";
import { LinkButton } from "../components/controls";
import { useDocumentTitle } from "../hooks";

const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="vr-stat">
      <TextSmall className="vr-muted">{label}</TextSmall>
      <TextStrong>{value}</TextStrong>
    </div>
  );
}

export function DestinationDetail() {
  const { id } = useParams();
  const { inputs, degraded, toggleSave, isSaved, reSpin } = useSession();
  const navigate = useNavigate();
  const { money, budgetUsd } = useFormatters();

  const pick = useMemo(
    () => (id ? describeDestination(id, inputs, { degraded }) : null),
    [id, inputs, degraded],
  );

  useDocumentTitle(
    pick ? `${pick.destination.name}, ${pick.destination.country}` : "Destination",
  );

  if (!pick) {
    return (
      <div className="vr-container" style={{ paddingBlock: "var(--sds-size-space-1200)" }}>
        <div className="vr-center">
          <Text>That destination isn't in your shortlist.</Text>
          <Button variant="primary" onPress={() => navigate("/results")}>
            Back to picks
          </Button>
        </div>
      </div>
    );
  }

  const { destination, enrichment } = pick;
  const origin = resolveOrigin(inputs);
  const isInternational = destination.countryCode !== origin.countryCode;
  const saved = isSaved(destination.id);

  return (
    <div className="vr-container vr-stack" style={{ paddingBlock: "var(--sds-size-space-800)" }}>
      <Button variant="subtle" size="small" onPress={() => navigate("/results")}>
        ← Back to picks
      </Button>

      <div className="vr-detail">
        <div className="vr-stack">
          <img className="vr-detail-image" src={destination.image.url} alt={destination.name} />
          <TextSmall className="vr-muted">{destination.image.attribution}</TextSmall>
        </div>

        <div className="vr-stack">
          <TextContentTitle
            title={`${destination.name}, ${destination.country}`}
            subtitle={destination.tagline}
          />

          <div className="vr-stack" style={{ gap: "var(--sds-size-space-150)" }}>
            <TextStrong>Why this fits</TextStrong>
            <Text className="vr-muted">{pick.rationale}</Text>
          </div>

          <div className="vr-stat-grid">
            <Stat label="Flight" value={`~${enrichment.flight.hours}h`} />
            <Stat
              label="Est. cost"
              value={`${money.short(enrichment.totalUsd)} / ${money.short(budgetUsd)}`}
            />
            <Stat
              label="Best for"
              value={destination.vibes.slice(0, 2).map(titleCase).join(" · ")}
            />
          </div>

          {isInternational && (
            <div className="vr-advisory">
              <Text>
                Entry requirements may apply —{" "}
                <a href={visaInfoUrl(destination)} target="_blank" rel="noopener noreferrer">
                  check before booking
                </a>
                .
              </Text>
            </div>
          )}

          <ButtonGroup>
            <LinkButton variant="primary" href={flightsUrl(origin, destination, inputs)}>
              Find flights
            </LinkButton>
            <LinkButton variant="neutral" href={staysUrl(destination, inputs)}>
              Find stays
            </LinkButton>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant={saved ? "primary" : "neutral"} onPress={() => toggleSave(pick)}>
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="subtle"
              onPress={() => {
                reSpin();
                navigate("/results");
              }}
            >
              Re-spin
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}
