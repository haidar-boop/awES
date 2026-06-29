import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../lib/store.jsx";
import { useLicense } from "../lib/license.jsx";
import UnlockModal from "./UnlockModal.jsx";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
        ✓
      </span>
      <span className="text-lg">
        Backtest <span className="text-brand">Reality Check</span>
      </span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { dark, toggle } = useTheme();
  const { isPro, openUnlock, clear } = useLicense();
  const loc = useLocation();
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-2">
            {isPro ? (
              <button
                onClick={clear}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600/10 px-3 py-2 text-sm font-semibold text-green-600"
                title="Pro active — click to sign out of Pro on this device"
              >
                ★ Pro
              </button>
            ) : (
              <button onClick={openUnlock} className="btn-ghost">
                Unlock Pro
              </button>
            )}
            {loc.pathname !== "/analyze" && (
              <Link to="/analyze" className="btn-primary">
                Analyze a strategy
              </Link>
            )}
            <button
              onClick={toggle}
              className="btn-ghost"
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </nav>
        </div>
      </header>
      <UnlockModal />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
        <p className="mx-auto max-w-3xl">
          <strong>Statistical analysis only. Not financial advice.</strong> Past
          performance does not guarantee future results. Backtest Reality Check
          reports whether a strategy <em>survives or fails</em> specific
          robustness checks — it never predicts profit.
        </p>
      </footer>
    </div>
  );
}
