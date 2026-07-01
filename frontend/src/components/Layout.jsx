import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { List, X, ArrowUpRight } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth.jsx";
import AuthModal from "./AuthModal.jsx";

// Brand mark — a plotted line resolving into a checkmark (logo, not a UI icon).
function Mark({ size = 30 }) {
  return (
    <span
      className="grid place-items-center rounded-xl bg-ink-elevated ring-1 ring-ink-edge"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 13.5L6.2 8.2L9.4 10.6L15.5 3.5" stroke="#58A6FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6.2" cy="8.2" r="1.1" fill="#3FB68B" />
        <circle cx="15.5" cy="3.5" r="1.1" fill="#3FB68B" />
      </svg>
    </span>
  );
}

function Logo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5 pl-1">
      <Mark />
      <span className="leading-none">
        <span className="block font-display text-[15px] font-semibold tracking-tight text-txt">
          True<span className="text-data">Sharpe</span>
        </span>
        <span className="mono-label mt-1 hidden text-[9px] sm:block">Backtest Reality Check</span>
      </span>
    </Link>
  );
}

const NAV = [
  { to: "/compare", label: "Compare" },
  { to: "/portfolio", label: "Portfolio" },
];

export default function Layout({ children }) {
  const { isAuthed, isPro, email, openUnlock, signOut } = useAuth();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);

  // Lock scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu]);
  // Close the overlay on route change.
  useEffect(() => { setMenu(false); }, [loc.pathname]);

  const links = [
    ...NAV,
    ...(isAuthed ? [{ to: "/history", label: "History" }] : []),
  ];

  return (
    <div className="flex min-h-full flex-col">
      {/* Fluid island nav — a floating glass pill detached from the top edge. */}
      <header className="fixed inset-x-0 top-0 z-30 px-3">
        <div className="mx-auto mt-4 flex w-full max-w-[1180px] items-center justify-between gap-2 rounded-full border border-ink-edge bg-ink-panel/70 px-2 py-2 pl-2.5 backdrop-blur-xl">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) =>
              loc.pathname !== l.to ? (
                <Link key={l.to} to={l.to} className="rounded-full px-3.5 py-2 text-sm font-medium text-txt-muted transition-colors hover:text-txt">
                  {l.label}
                </Link>
              ) : null
            )}

            {isPro ? (
              <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-robust/30 bg-robust/10 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-eyebrow text-robust">
                <span className="h-1.5 w-1.5 rounded-full bg-robust" />
                Pro
              </span>
            ) : loc.pathname !== "/pro" ? (
              <Link to="/pro" className="rounded-full px-3.5 py-2 text-sm font-medium text-txt-muted transition-colors hover:text-txt">
                Pricing
              </Link>
            ) : null}

            {isAuthed ? (
              <button onClick={signOut} title={email ? `Signed in as ${email}` : "Log out"} className="rounded-full px-3.5 py-2 text-sm font-medium text-txt-muted transition-colors hover:text-txt">
                Log out
              </button>
            ) : (
              <button onClick={openUnlock} className="rounded-full px-3.5 py-2 text-sm font-medium text-txt-muted transition-colors hover:text-txt">
                Sign in
              </button>
            )}

            {loc.pathname !== "/analyze" && (
              <Link to="/analyze" className="btn-primary group ml-1 py-2.5 pl-5 pr-2.5">
                Analyze
                <span className="btn-nib" aria-hidden="true">
                  <ArrowUpRight size={15} weight="bold" />
                </span>
              </Link>
            )}
          </nav>

          {/* Mobile trigger */}
          <button
            onClick={() => setMenu((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-txt md:hidden"
            aria-label={menu ? "Close menu" : "Open menu"}
          >
            {menu ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </header>

      {/* Mobile full-screen overlay with staggered reveals. */}
      {menu && (
        <div className="fixed inset-0 z-20 bg-ink-base/80 backdrop-blur-2xl md:hidden">
          <nav className="flex min-h-full flex-col justify-center gap-1 px-8 pt-24">
            {[...links, { to: "/pro", label: "Pricing" }].map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                className="motion-safe:animate-reveal font-display text-3xl font-semibold tracking-tight text-txt"
                style={{ animationDelay: `${60 + i * 60}ms` }}
              >
                {l.label}
              </Link>
            ))}
            <div className="motion-safe:animate-reveal mt-8 flex flex-col gap-3" style={{ animationDelay: "300ms" }}>
              {isAuthed ? (
                <button onClick={signOut} className="btn-ghost w-full justify-center">Log out</button>
              ) : (
                <button onClick={() => { setMenu(false); openUnlock(); }} className="btn-ghost w-full justify-center">Sign in</button>
              )}
              <Link to="/analyze" className="btn-primary w-full justify-center">Analyze a strategy</Link>
            </div>
          </nav>
        </div>
      )}

      <AuthModal />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pb-24 pt-28 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-ink-edge px-6 py-10 text-center">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-txt-muted">
          <strong className="font-medium text-txt">
            Statistical analysis only. Not financial advice.
          </strong>{" "}
          Past performance does not guarantee future results. TrueSharpe reports
          whether a strategy <em>survives or fails</em> specific robustness checks
          — it never predicts profit.
        </p>
      </footer>
    </div>
  );
}
