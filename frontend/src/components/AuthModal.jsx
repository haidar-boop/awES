import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { useAnalysis } from "../lib/store.jsx";
import { analyze } from "../lib/api.js";

const PRO_FEATURES = [
  ["Deflated Sharpe Ratio", "The data-mining test — adjusts for how many variations you tried."],
  ["Backtest-overfit probability (PBO)", "How often the edge vanishes out-of-sample."],
  ["Monte Carlo simulation", "Thousands of resamples + the outcome cone chart."],
  ["Downloadable PDF report", "The shareable, audit-style deliverable."],
];

export default function AuthModal() {
  const {
    config, isAuthed, isVerified, isPro, email,
    signUp, signIn, signOut, resend, refreshMe,
    unlockOpen, closeUnlock,
  } = useAuth();
  const { request, setAnalysis } = useAnalysis();

  const [mode, setMode] = useState("signup"); // signup | signin
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }
  const doneRef = useRef(false);

  const stage = !config.auth_enabled
    ? "unconfigured"
    : !isAuthed
    ? "auth"
    : !isVerified
    ? "verify"
    : !isPro
    ? "pay"
    : "pro";

  // While waiting on payment, poll the server for the entitlement.
  useEffect(() => {
    if (!unlockOpen || stage !== "pay") return;
    const id = setInterval(() => refreshMe(), 5000);
    return () => clearInterval(id);
  }, [unlockOpen, stage, refreshMe]);

  // Once Pro, re-run the current analysis as Pro and close.
  useEffect(() => {
    if (unlockOpen && isPro && !doneRef.current) {
      doneRef.current = true;
      (async () => {
        if (request) {
          try {
            const res = await analyze(request);
            setAnalysis(res);
          } catch {
            /* ignore */
          }
        }
        setTimeout(() => {
          closeUnlock();
          doneRef.current = false;
        }, 1200);
      })();
    }
  }, [unlockOpen, isPro, request, setAnalysis, closeUnlock]);

  if (!unlockOpen) return null;

  function close() {
    setMsg(null);
    closeUnlock();
  }

  async function submitAuth(e) {
    e?.preventDefault?.();
    if (!form.email || !form.password) {
      setMsg({ type: "error", text: "Enter your email and a password." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await signUp(form.email, form.password);
        if (error) setMsg({ type: "error", text: error.message });
        else
          setMsg({
            type: "info",
            text: "Check your email for a verification link. Click it, then come back and log in.",
          });
      } else {
        const { error } = await signIn(form.email, form.password);
        if (error) {
          const text = /confirm/i.test(error.message)
            ? "Please verify your email first — check your inbox for the link."
            : error.message;
          setMsg({ type: "error", text });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function doResend() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await resend(email || form.email);
      setMsg(
        error
          ? { type: "error", text: error.message }
          : { type: "info", text: "Verification email resent." }
      );
    } finally {
      setBusy(false);
    }
  }

  function checkoutUrl() {
    const base = config.checkout_url;
    if (!base) return "";
    const sep = base.includes("?") ? "&" : "?";
    const param = config.checkout_email_param || "checkout[email]";
    return `${base}${sep}${param}=${encodeURIComponent(email)}`;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={close}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-txt">
            Unlock the full report
          </h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-200" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-txt-muted">
          The verdict and core stats are free. Pro adds the advanced robustness
          suite and the shareable PDF.
        </p>

        <ul className="mt-4 space-y-2">
          {PRO_FEATURES.map(([t, d]) => (
            <li key={t} className="flex gap-2.5 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-data" aria-hidden="true" />
              <span>
                <span className="font-semibold text-slate-900 dark:text-txt">{t}</span> —{" "}
                <span className="text-slate-500 dark:text-txt-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          {stage === "unconfigured" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Accounts aren’t configured on this deployment yet.
            </p>
          )}

          {stage === "auth" && (
            <>
              <div className="mb-3 inline-flex rounded-lg border border-slate-300 p-0.5 text-sm dark:border-slate-700">
                {["signup", "signin"].map((m) => (
                  <button
                    key={m}
                    className={`rounded-sm px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-label ${mode === m ? "bg-data text-ink-base" : "text-slate-600 dark:text-txt-muted"}`}
                    onClick={() => { setMode(m); setMsg(null); }}
                  >
                    {m === "signup" ? "Create account" : "Log in"}
                  </button>
                ))}
              </div>
              <form onSubmit={submitAuth} className="space-y-3">
                <input
                  type="email" className="input" placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  type="password" className="input"
                  placeholder={mode === "signup" ? "Choose a password" : "Your password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button className="btn-primary w-full" disabled={busy}>
                  {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
                </button>
              </form>
            </>
          )}

          {stage === "verify" && (
            <div className="space-y-3">
              <p className="text-sm">
                We sent a verification link to <strong>{email}</strong>. Click it to
                confirm your email, then this page will continue.
              </p>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={doResend} disabled={busy}>
                  Resend email
                </button>
                <button className="btn-primary" onClick={refreshMe}>
                  I’ve verified — continue
                </button>
              </div>
              <button onClick={signOut} className="text-xs text-slate-500 hover:underline">
                Use a different account
              </button>
            </div>
          )}

          {stage === "pay" && (
            <div className="space-y-3">
              <p className="text-sm">
                Signed in as <strong>{email}</strong>. One step left — unlock Pro:
              </p>
              {config.payments_enabled && config.checkout_url ? (
                <>
                  <a
                    href={checkoutUrl()} target="_blank" rel="noreferrer"
                    className="btn-primary w-full"
                  >
                    Pay &amp; unlock — {config.price_label}
                  </a>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    After payment this page unlocks automatically.
                  </div>
                </>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Payments aren’t configured on this deployment yet.
                </p>
              )}
              <button onClick={signOut} className="text-xs text-slate-500 hover:underline">
                Log out
              </button>
            </div>
          )}

          {stage === "pro" && (
            <div className="flex items-center gap-2 rounded-md border border-robust/40 bg-robust/10 px-4 py-3 text-sm font-medium text-robust">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              You’re Pro — loading your full report…
            </div>
          )}

          {msg && (
            <p className={`mt-3 text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
