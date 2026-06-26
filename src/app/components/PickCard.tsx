import { useNavigate } from "react-router-dom";
import { Button, ButtonGroup, Tag, Text, TextHeading, TextSmall } from "primitives";
import { flightsUrl, resolveOrigin } from "../../engine";
import type { Pick } from "../../engine/types";
import { useSession } from "../../state/SessionContext";
import { useFormatters } from "../useFormatters";
import { LinkButton } from "./controls";

export function PickCard({ pick }: { pick: Pick }) {
  const navigate = useNavigate();
  const { inputs } = useSession();
  const { money } = useFormatters();
  const { destination, enrichment } = pick;

  const tags = destination.interests.slice(0, 2).map((t) => t.replace(/_/g, " "));
  const stats = `~${enrichment.flight.hours}h · ${money.short(enrichment.totalUsd)} · ${tags.join(" + ")}`;
  const booking = flightsUrl(resolveOrigin(inputs), destination, inputs);

  return (
    <div className="vr-card vr-stack" style={{ gap: 0 }}>
      <img className="vr-pick-image" src={destination.image.url} alt={destination.name} loading="lazy" />
      <div className="vr-card-pad vr-stack" style={{ gap: "var(--sds-size-space-200)" }}>
        <div className="vr-row" style={{ justifyContent: "space-between" }}>
          <TextHeading>{`${destination.name}, ${destination.country}`}</TextHeading>
          {pick.stretch ? (
            <Tag scheme="warning" variant="secondary">Stretch pick</Tag>
          ) : enrichment.flight.estimated ? (
            <Tag scheme="neutral" variant="secondary">Estimated</Tag>
          ) : null}
        </div>
        <Text className="vr-muted" lineClamp={3}>
          {pick.rationale}
        </Text>
        <TextSmall>{stats}</TextSmall>
        <ButtonGroup align="justify">
          <Button variant="neutral" size="small" onPress={() => navigate(`/destination/${destination.id}`)}>
            Details
          </Button>
          <LinkButton variant="primary" size="small" href={booking}>
            Book
          </LinkButton>
        </ButtonGroup>
      </div>
    </div>
  );
}
