
  import { createRoot } from "react-dom/client";
  import { BrowserRouter, Routes, Route, Navigate } from "react-router";
  import InstrumentPage from "./app/instrument/InstrumentPage.tsx";
  import LegacyApp from "./app/legacy/LegacyApp.tsx";
  import MapPage from "./app/pages/MapPage.tsx";
  import AboutPage from "./app/pages/AboutPage.tsx";
  import ExamplesPage from "./app/pages/ExamplesPage.tsx";
  import { LanguageProvider } from "./app/i18n/LanguageContext.tsx";
  import "./styles/index.css";

  // The v1 per-reel map pages now live as sections of the Product map.
  // (The static build also writes redirect pages at these URLs.)
  const OLD_MAPS = { space: "space", format: "form", twist: "twist" };

  // Every route also gets a static HTML shell at build time
  // (scripts/generate-route-shells.mjs). Trailing slashes in URLs match
  // these routes too, and are the canonical form.
  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<InstrumentPage modeId="product" />} />
          <Route path="/hackathon" element={<InstrumentPage modeId="hackathon" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/examples" element={<ExamplesPage />} />
          <Route path="/maps" element={<MapPage key="product" modeId="product" />} />
          <Route path="/maps/hackathon" element={<MapPage key="hackathon" modeId="hackathon" />} />
          {Object.entries(OLD_MAPS).map(([old, reel]) => (
            <Route
              key={old}
              path={`/maps/${old}`}
              element={<Navigate replace to={{ pathname: "/maps/", hash: `#${reel}` }} />}
            />
          ))}
          {/* The original slot machine (Product mode only), kept as-is. */}
          <Route path="/legacy" element={<LegacyApp />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>,
  );
