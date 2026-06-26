import { Component, type ReactNode } from "react";
import { Button, TextContentTitle } from "primitives";

interface State {
  hasError: boolean;
}

/** App-level error state (PRD section 11). Catches render errors and offers a
 * clean way back into the flow. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Vacation Roulette error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="vr-container" style={{ paddingBlock: "var(--sds-size-space-1200)" }}>
        <div className="vr-center">
          <TextContentTitle
            align="center"
            title="Something went sideways"
            subtitle="An unexpected error interrupted your spin. Let's start fresh."
          />
          <Button variant="primary" onPress={() => { window.location.hash = "#/"; window.location.reload(); }}>
            Start over
          </Button>
        </div>
      </div>
    );
  }
}
