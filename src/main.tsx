import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { APP_REGISTRY } from "./apps/registry.ts";
import { formatProblems, validateTree } from "./content/vfs.ts";
import { registerWindowTypes } from "./window-system/registry.ts";

// PARKED — rebuilt in phase 5. src/editor/ and src/set-password/ stay on disk.
// const PageSetPassword = lazy(() => import("./set-password/PageSetPassword.tsx"));
// const Editor = lazy(() => import("./editor/Editor.tsx"));

registerWindowTypes(APP_REGISTRY);

// Strict in dev, forgiving in production: the editor is a route in this same
// bundle, so a bad content push must not take down the tool needed to fix it.
// validateTree() has already quarantined the offending nodes by this point.
const problems = validateTree(new Set(Object.keys(APP_REGISTRY)));
const errors = problems.filter((p) => p.severity === "error");
const warnings = problems.filter((p) => p.severity === "warning");

if (warnings.length > 0) console.warn(`[vfs] content warnings\n${formatProblems(warnings)}`);
if (errors.length > 0) {
  if (import.meta.env.DEV) {
    throw new Error(`[vfs] invalid content tree:\n${formatProblems(errors)}`);
  }
  console.error(`[vfs] dropped invalid nodes\n${formatProblems(errors)}`);
}

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
