
  import { createRoot } from "react-dom/client";
  import { BrowserRouter, Routes, Route } from "react-router";
  import InstrumentPage from "./app/instrument/InstrumentPage.tsx";
  import LegacyApp from "./app/legacy/LegacyApp.tsx";
  import SpaceMapPage from "./app/pages/SpaceMapPage.tsx";
  import FormatMapPage from "./app/pages/FormatMapPage.tsx";
  import TwistMapPage from "./app/pages/TwistMapPage.tsx";
  import { LanguageProvider } from "./app/i18n/LanguageContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<InstrumentPage modeId="product" />} />
          <Route path="/hackathon" element={<InstrumentPage modeId="hackathon" />} />
          {/* The original slot machine (Product mode only), kept as-is. */}
          <Route path="/legacy" element={<LegacyApp />} />
          <Route path="/maps/space" element={<SpaceMapPage />} />
          <Route path="/maps/format" element={<FormatMapPage />} />
          <Route path="/maps/twist" element={<TwistMapPage />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>,
  );
