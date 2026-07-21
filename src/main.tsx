import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import { AppProviders } from "./app/providers/AppProviders";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import { notifyPwaUpdateAvailable } from "./mobileReliability";
import { initThemeFromStorage } from "./design-system/aura/themeStore";

initThemeFromStorage();

registerSW({
  immediate: true,
  onNeedRefresh() {
    notifyPwaUpdateAvailable();
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);