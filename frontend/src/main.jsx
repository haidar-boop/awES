import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AnalysisProvider } from "./lib/store.jsx";
import { LicenseProvider } from "./lib/license.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LicenseProvider>
        <AnalysisProvider>
          <App />
        </AnalysisProvider>
      </LicenseProvider>
    </BrowserRouter>
  </React.StrictMode>
);
