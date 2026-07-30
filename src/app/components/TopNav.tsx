import { Link } from "react-router-dom";
import { Button, IconButton } from "primitives";
import { IconMoon, IconSun } from "icons";
import { useThemeMode } from "../hooks";

export function TopNav() {
  const [theme, , toggleTheme] = useThemeMode();
  const nextLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

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
          <IconButton
            variant="subtle"
            aria-label={nextLabel}
            onPress={toggleTheme}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </IconButton>
        </div>
      </div>
    </nav>
  );
}
