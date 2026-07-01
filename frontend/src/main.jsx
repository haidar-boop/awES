import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AnalysisProvider } from "./lib/store.jsx";
import { AuthProvider } from "./lib/auth.jsx";
// Self-hosted variable fonts (bundled, no external <link>).
import "@fontsource-variable/bricolage-grotesque"; // display
import "@fontsource-variable/geist";               // body / UI
import "@fontsource-variable/geist-mono";          // data / numerals
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnalysisProvider>
          <App />
        </AnalysisProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
