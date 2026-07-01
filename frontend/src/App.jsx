import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AccessGate from "./components/AccessGate.jsx";
import Landing from "./pages/Landing.jsx";
import Analyze from "./pages/Analyze.jsx";
import Compare from "./pages/Compare.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import History from "./pages/History.jsx";
import Pro from "./pages/Pro.jsx";
import Results from "./pages/Results.jsx";

export default function App() {
  return (
    <AccessGate>
      <div className="min-h-full motion-safe:animate-unlock">
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/history" element={<History />} />
            <Route path="/pro" element={<Pro />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Layout>
      </div>
    </AccessGate>
  );
}
