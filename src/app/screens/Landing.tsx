import { useNavigate } from "react-router-dom";
import { Button, ButtonGroup, Text, TextContentTitle, TextHeading, TextSubtitle } from "primitives";
import { useSession } from "../../state/SessionContext";
import { useDocumentTitle } from "../hooks";

const FEATURES = [
  {
    title: "Tuned to your vibe",
    body: "Eight quick questions capture your dates, group, budget, and the mood of the trip.",
  },
  {
    title: "Real prices & flight times",
    body: "Every candidate is checked against estimated flight time and total cost before it can win.",
  },
  {
    title: "One spin, 3 great picks",
    body: "The wheel only lands on your top matches — so every result is somewhere you'd actually go.",
  },
];

export function Landing() {
  const navigate = useNavigate();
  const { run } = useSession();
  useDocumentTitle("Don't pick, just spin");

  const start = () => {
    navigate("/plan");
  };

  return (
    <div className="vr-container vr-stack" style={{ paddingBlock: "var(--sds-size-space-1200)", gap: "var(--sds-size-space-1200)" }}>
      <section className="vr-hero">
        <div className="vr-stack">
          <TextContentTitle
            title="Don't pick. Just spin."
            subtitle="Answer 8 quick questions and get 3 destinations tuned to your dates, budget, group, and vibe."
          />
          <ButtonGroup>
            <Button size="medium" variant="primary" onPress={start}>
              Start the spin
            </Button>
            <Button size="medium" variant="neutral" href="#how-it-works">
              How it works
            </Button>
          </ButtonGroup>
        </div>
        <img
          className="vr-hero-image"
          src="https://picsum.photos/seed/vr-hero/1000/750"
          alt="A scenic travel destination"
        />
      </section>

      <section id="how-it-works" className="vr-stack">
        <TextSubtitle elementType="h2">How it works</TextSubtitle>
        <div className="vr-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="vr-card vr-card-pad vr-stack" style={{ gap: "var(--sds-size-space-150)" }}>
              <TextHeading>{f.title}</TextHeading>
              <Text className="vr-muted">{f.body}</Text>
            </div>
          ))}
        </div>
        <div>
          <Button
            size="medium"
            variant="primary"
            onPress={() => {
              run();
              start();
            }}
          >
            Start the spin
          </Button>
        </div>
      </section>
    </div>
  );
}
