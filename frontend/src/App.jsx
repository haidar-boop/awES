import { useState } from "react";
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
  // Play the unlock reveal once, then drop the animation class. A filling
  // animation (fill-mode: both) keeps an identity transform/filter on this
  // wrapper forever, which makes it the containing block for any fixed-position
  // descendant (dropdowns, mobile nav) and pins them here instead of the
  // viewport. Removing the class after the reveal releases that containing block.
  const [revealed, setRevealed] = useState(false);
  return (
    <AccessGate>
      <div
        className={revealed ? "min-h-full" : "min-h-full motion-safe:animate-unlock"}
        onAnimationEnd={(e) => {
          if (e.animationName === "unlock") setRevealed(true);
        }}
      >
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
