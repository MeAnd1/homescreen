import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { APP_REGISTRY } from "./apps/registry.ts";
import { registerWindowTypes } from "./window-system/registry.ts";

// PARKED — rebuilt in phase 5. src/editor/ and src/set-password/ stay on disk.
// const PageSetPassword = lazy(() => import("./set-password/PageSetPassword.tsx"));
// const Editor = lazy(() => import("./editor/Editor.tsx"));

registerWindowTypes(APP_REGISTRY);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/homescreen">
      <Routes>
        <Route path="/" element={<App />} />
        {/* PARKED — rebuilt in phase 5
        <Route path="/set-password" element={<PageSetPassword />} />
        <Route path="/editor" element={<Editor />} /> */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
