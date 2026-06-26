import { Navigate, Route, Routes } from "react-router-dom";
import { TextSmall } from "primitives";
import { TopNav } from "./components/TopNav";
import { Landing } from "./screens/Landing";
import { Questionnaire } from "./screens/Questionnaire";
import { Spin } from "./screens/Spin";
import { Results } from "./screens/Results";
import { DestinationDetail } from "./screens/DestinationDetail";

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--sds-color-border-default-secondary)" }}>
      <div className="vr-container vr-nav-inner">
        <TextSmall className="vr-muted">
          Vacation Roulette — a mock-first MVP. Prices, flight times, and imagery
          are estimates; verify before booking.
        </TextSmall>
      </div>
    </footer>
  );
}

export function AppRoutes() {
  return (
    <div className="vr-app">
      <TopNav />
      <main className="vr-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/plan" element={<Questionnaire />} />
          <Route path="/spin" element={<Spin />} />
          <Route path="/results" element={<Results />} />
          <Route path="/destination/:id" element={<DestinationDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
