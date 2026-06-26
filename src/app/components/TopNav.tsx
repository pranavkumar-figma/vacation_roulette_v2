import { Link } from "react-router-dom";
import { Button } from "primitives";

export function TopNav() {
  return (
    <nav className="vr-nav" aria-label="Primary">
      <div className="vr-container vr-nav-inner">
        <Link to="/" className="vr-brand">
          <span className="vr-brand-mark" aria-hidden="true" />
          Vacation Roulette
        </Link>
        <div className="vr-nav-links">
          <Button variant="subtle" href="/#/plan">
            Plan a trip
          </Button>
        </div>
      </div>
    </nav>
  );
}
