import { createContext, useContext, useEffect, useState } from "react";

// Holds the most recent analysis result so Analyze -> Results survives nav and
// page refresh (persisted to sessionStorage).
const AnalysisContext = createContext(null);
const KEY = "brc:analysis";

const REQ_KEY = "brc:request";

export function AnalysisProvider({ children }) {
  const [analysis, setAnalysisState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // The request that produced the current analysis, so we can re-run it after
  // the user unlocks Pro (null for built-in samples, which are already full).
  const [request, setRequestState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(REQ_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setAnalysis = (a) => {
    setAnalysisState(a);
    try {
      if (a) sessionStorage.setItem(KEY, JSON.stringify(a));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* storage may be unavailable; in-memory still works */
    }
  };

  const setRequest = (r) => {
    setRequestState(r);
    try {
      if (r) sessionStorage.setItem(REQ_KEY, JSON.stringify(r));
      else sessionStorage.removeItem(REQ_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <AnalysisContext.Provider
      value={{ analysis, setAnalysis, request, setRequest }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

// Theme (dark default) -------------------------------------------------------
export function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("brc:theme");
    if (saved) return saved === "dark";
    return true; // dark by default (traders prefer dark UIs)
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("brc:theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}
