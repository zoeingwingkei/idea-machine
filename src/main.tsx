
  import { createRoot } from "react-dom/client";
  import { BrowserRouter, Routes, Route } from "react-router";
  import App from "./app/App.tsx";
  import SpaceMapPage from "./app/pages/SpaceMapPage.tsx";
  import FormatMapPage from "./app/pages/FormatMapPage.tsx";
  import TwistMapPage from "./app/pages/TwistMapPage.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/maps/space" element={<SpaceMapPage />} />
        <Route path="/maps/format" element={<FormatMapPage />} />
        <Route path="/maps/twist" element={<TwistMapPage />} />
      </Routes>
    </BrowserRouter>,
  );
