import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import SocialAuthButtons from "./SocialAuthButtons.jsx";

// First-impression access threshold. This is a VISUAL gate only — it never
// changes backend auth logic and never blocks the free tool. Real sign-in,
// verification and Pro unlock continue to live in the existing AuthModal,
// reachable from the header once inside. Already-authenticated sessions pass
// straight through.
const KEY = "ts:gate";

function Mark() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-lg border border-ink-edge bg-ink-elevated">
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 13.5L6.2 8.2L9.4 10.6L15.5 3.5" stroke="#58A6FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6.2" cy="8.2" r="1.1" fill="#3FB68B" />
        <circle cx="15.5" cy="3.5" r="1.1" fill="#3FB68B" />
      </svg>
    </span>
  );
}

const TRUST = [
  "No performance guarantees",
  "Statistical evaluation only",
  "Designed for quantitative validation",
];

const UNLOCK_LINES = [
  "AUTHORIZING SESSION",
  "CALIBRATING DIAGNOSTIC ENGINE",
  "ACCESS GRANTED",
];

function UnlockSequence({ onDone }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const t1 = setTimeout(() => setStep(1), 280);
    const t2 = setTimeout(() => setStep(2), 560);
    const t3 = setTimeout(onDone, 980);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-base">
      <div className="w-full max-w-sm px-6 font-mono text-[13px]">
        {UNLOCK_LINES.map((line, i) => (
          <div
            key={line}
            className={`flex items-center gap-3 py-1.5 transition-opacity duration-300 ${
              i <= step ? "opacity-100" : "opacity-25"
            }`}
          >
            <span className={i < step ? "text-robust" : i === step ? "text-data" : "text-txt-faint"}>
              {i < step ? "✓" : i === step ? "›" : "·"}
            </span>
            <span className={i === 2 && step >= 2 ? "text-robust" : "text-txt-muted"}>{line}</span>
          </div>
        ))}
        <div className="mt-4 h-px w-full overflow-hidden bg-ink-edge">
          <div className="h-full w-1/3 animate-scan bg-data/60" />
        </div>
      </div>
    </div>
  );
}

export default function AccessGate({ children }) {
  const { ready, isAuthed, email: authedEmail } = useAuth();
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === "open";
    } catch {
      return false;
    }
  });
  const [entering, setEntering] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState(null);
  const passedRef = useRef(open);

  const pass = () => {
    try {
      sessionStorage.setItem(KEY, "open");
    } catch {
      /* storage may be unavailable */
    }
    passedRef.current = true;
    setOpen(true);
  };

  // Returning / already-signed-in sessions skip the gate once auth resolves.
  useEffect(() => {
    if (ready && isAuthed && !passedRef.current) pass();
  }, [ready, isAuthed]);

  if (open) return children;

  function enter(e) {
    e?.preventDefault?.();
    const trimmed = email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErr("Enter a valid email, or continue as a guest below.");
      return;
    }
    setErr(null);
    setEntering(true);
  }

  // Don't flash the gate before we know whether the session is already authed.
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-base">
        <div className="font-mono text-xs uppercase tracking-label text-txt-faint">
          Initializing…
        </div>
      </div>
    );
  }

  return (
    <>
      {entering && <UnlockSequence onDone={pass} />}
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-base px-4 py-10">
        {/* faint instrument grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(#262D38 1px, transparent 1px), linear-gradient(90deg, #262D38 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(60% 60% at 50% 35%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(60% 60% at 50% 35%, #000 30%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <main className="relative w-full max-w-md animate-settle">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mark />
              <div className="leading-none">
                <div className="font-display text-lg font-bold tracking-tight text-txt">
                  True<span className="text-data">Sharpe</span>
                </div>
                <div className="mono-label mt-1">Statistical Validation Engine</div>
              </div>
            </div>
            <span className="rounded-sm border border-ink-edge bg-ink-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-label text-txt-muted">
              Secure Access
            </span>
          </div>

          <div className="card p-6 sm:p-7">
            {/* (A) Hero access statement */}
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-txt">
              Access TrueSharpe Analysis
            </h1>
            {/* (B) Minimal explanation block */}
            <p className="mt-3 text-sm leading-relaxed text-txt-muted">
              TrueSharpe validates trading strategies statistically. Overfitting
              detection is central. Results are diagnostics, not predictions — a
              measurement of whether an edge survives scrutiny.
            </p>

            {/* (C) Social sign-up */}
            <div className="mt-6">
              <SocialAuthButtons onError={setErr} verb="Sign up" />
            </div>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-ink-edge" />
              <span className="mono-label">or with email</span>
              <span className="h-px flex-1 bg-ink-edge" />
            </div>

            {/* (C)(D) Inputs + primary action */}
            <form onSubmit={enter} className="space-y-3">
              <div>
                <label htmlFor="gate-email" className="label">Email</label>
                <input
                  id="gate-email"
                  type="email"
                  autoComplete="email"
                  className="input font-mono"
                  placeholder="you@desk.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                />
              </div>
              <div>
                <label htmlFor="gate-code" className="label">Access code · optional</label>
                <input
                  id="gate-code"
                  type="password"
                  autoComplete="off"
                  className="input font-mono"
                  placeholder="—"
                  value={code}
                  onChange={(ev) => setCode(ev.target.value)}
                />
              </div>
              {err && <p className="font-mono text-xs text-overfit">{err}</p>}
              <button type="submit" className="btn-primary w-full">
                Request Access
                <span aria-hidden="true" className="font-mono">→</span>
              </button>
            </form>

            {/* (E) Trust layer */}
            <ul className="mt-6 grid gap-2 border-t hairline pt-5">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-label text-txt-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-data/70" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-col items-center gap-2 text-center">
            <button
              type="button"
              onClick={() => setEntering(true)}
              className="font-mono text-xs uppercase tracking-label text-txt-faint underline-offset-4 hover:text-txt-muted hover:underline"
            >
              Continue as guest
            </button>
            <p className="text-[11px] text-txt-faint">
              Statistical evaluation only · Not financial advice
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
