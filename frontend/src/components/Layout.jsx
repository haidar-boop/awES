import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../lib/store.jsx";
import { useAuth } from "../lib/auth.jsx";
import AuthModal from "./AuthModal.jsx";

function Mark() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-md border border-ink-edge bg-ink-elevated">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 13.5L6.2 8.2L9.4 10.6L15.5 3.5" stroke="#58A6FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6.2" cy="8.2" r="1.1" fill="#3FB68B" />
        <circle cx="15.5" cy="3.5" r="1.1" fill="#3FB68B" />
      </svg>
    </span>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <Mark />
      <span className="leading-none">
        <span className="block font-display text-base font-bold tracking-tight text-slate-900 dark:text-txt">
          True<span className="text-data">Sharpe</span>
        </span>
        <span className="mono-label hidden sm:block">Backtest Reality Check</span>
      </span>
    </Link>
  );
}

function ThemeIcon({ dark }) {
  return dark ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Layout({ children }) {
  const { dark, toggle } = useTheme();
  const { isAuthed, isPro, email, openUnlock, signOut } = useAuth();
  const loc = useLocation();
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/85 backdrop-blur dark:border-ink-edge dark:bg-ink-base/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-2">
            {isPro && (
              <span className="hidden items-center gap-1.5 rounded-sm border border-robust/30 bg-robust/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-label text-robust sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-robust" />
                Pro
              </span>
            )}
            {!isPro && (
              <button onClick={openUnlock} className="btn-ghost">
                Unlock Pro
              </button>
            )}
            {isAuthed ? (
              <button
                onClick={signOut}
                className="btn-ghost"
                title={email ? `Signed in as ${email}` : "Log out"}
              >
                Log out
              </button>
            ) : (
              <button onClick={openUnlock} className="btn-ghost">
                Sign in
              </button>
            )}
            {loc.pathname !== "/compare" && (
              <Link to="/compare" className="btn-ghost hidden sm:inline-flex">
                Compare
              </Link>
            )}
            {loc.pathname !== "/analyze" && (
              <Link to="/analyze" className="btn-primary">
                Analyze a strategy
              </Link>
            )}
            <button
              onClick={toggle}
              className="btn-ghost px-2.5"
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              <ThemeIcon dark={dark} />
            </button>
          </nav>
        </div>
      </header>
      <AuthModal />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-ink-edge dark:text-txt-muted">
        <p className="mx-auto max-w-3xl leading-relaxed">
          <strong className="font-semibold text-slate-700 dark:text-txt">
            Statistical analysis only. Not financial advice.
          </strong>{" "}
          Past performance does not guarantee future results. TrueSharpe reports
          whether a strategy <em>survives or fails</em> specific robustness
          checks — it never predicts profit.
        </p>
      </footer>
    </div>
  );
}
