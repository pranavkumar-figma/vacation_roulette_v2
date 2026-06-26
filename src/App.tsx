import { HashRouter } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { ErrorBoundary } from "./app/components/ErrorBoundary";
import { SessionProvider } from "./state/SessionContext";
import "./app/app.css";

function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default App;
