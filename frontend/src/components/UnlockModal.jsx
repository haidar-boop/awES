import { useEffect, useRef, useState } from "react";
import { useLicense } from "../lib/license.jsx";
import { useAnalysis } from "../lib/store.jsx";
import { analyze } from "../lib/api.js";

const PRO_FEATURES = [
  ["Deflated Sharpe Ratio", "The data-mining test — adjusts for how many variations you tried."],
  ["Backtest-overfit probability (PBO)", "How often the edge vanishes out-of-sample."],
  ["Monte Carlo simulation", "Thousands of resamples + the outcome cone chart."],
  ["Downloadable PDF report", "The shareable, audit-style deliverable."],
];

const POLL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes

// Global unlock modal — rendered once in Layout, opened via openUnlock().
// Flow: enter email → pay → the page unlocks automatically (no key to paste).
export default function UnlockModal() {
  const { config, email, claim, unlockOpen, closeUnlock } = useLicense();
  const { request, setAnalysis } = useAnalysis();
  const [emailInput, setEmailInput] = useState(email || "");
  const [phase, setPhase] = useState("idle"); // idle | waiting | ok | error
  const [message, setMessage] = useState("");
  const pollRef = useRef(null);
  const triesRef = useRef(0);

  useEffect(() => setEmailInput(email || ""), [email]);
  useEffect(() => () => stopPolling(), []); // clear on unmount

  if (!unlockOpen) return null;

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    triesRef.current = 0;
  }

  const validEmail = (e) => /\S+@\S+\.\S+/.test((e || "").trim());

  function checkoutUrl() {
    const base = config.checkout_url;
    if (!base) return "";
    const sep = base.includes("?") ? "&" : "?";
    const param = config.checkout_email_param || "checkout[email]";
    return `${base}${sep}${param}=${encodeURIComponent(emailInput.trim())}`;
  }

  // One unlock attempt. Resolves true on success.
  async function attempt() {
    try {
      await claim(emailInput); // throws (404) until the purchase is found
      stopPolling();
      setPhase("ok");
      if (request) {
        try {
          const res = await analyze(request); // re-run as Pro
          setAnalysis(res);
        } catch {
          /* keep success; user can re-run manually */
        }
      }
      setTimeout(() => {
        closeUnlock();
        setPhase("idle");
      }, 1200);
      return true;
    } catch {
      return false;
    }
  }

  function startPolling() {
    stopPolling();
    setPhase("waiting");
    setMessage("");
    attempt(); // try immediately
    pollRef.current = setInterval(async () => {
      triesRef.current += 1;
      const ok = await attempt();
      if (!ok && triesRef.current >= MAX_POLLS) {
        stopPolling();
        setPhase("error");
        setMessage(
          "We still haven't seen a completed purchase for that email. If you " +
            "paid, contact support; otherwise check the address and try again."
        );
      }
    }, POLL_MS);
  }

  function pay() {
    if (!validEmail(emailInput)) {
      setPhase("error");
      setMessage("Please enter a valid email first.");
      return;
    }
    window.open(checkoutUrl(), "_blank", "noopener");
    startPolling();
  }

  function checkNow() {
    if (!validEmail(emailInput)) {
      setPhase("error");
      setMessage("Please enter the email you paid with.");
      return;
    }
    startPolling();
  }

  function close() {
    stopPolling();
    setPhase("idle");
    closeUnlock();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={close}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">Unlock the full report</h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The verdict and core stats are free. Pro adds the advanced robustness
          suite and the shareable PDF.
        </p>

        <ul className="mt-4 space-y-2">
          {PRO_FEATURES.map(([t, d]) => (
            <li key={t} className="flex gap-2 text-sm">
              <span className="text-brand">★</span>
              <span>
                <span className="font-semibold">{t}</span> —{" "}
                <span className="text-slate-500 dark:text-slate-400">{d}</span>
              </span>
            </li>
          ))}
        </ul>

        {phase === "ok" ? (
          <div className="mt-5 rounded-lg border border-green-600/40 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
            ✓ Pro unlocked! Loading your full report…
          </div>
        ) : (
          <>
            <div className="mt-5">
              <label className="label">Your email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={phase === "waiting"}
              />
              <p className="mt-1 text-xs text-slate-500">
                Use this same email at checkout — we’ll unlock Pro on this site
                automatically once your payment goes through.
              </p>
            </div>

            {config.payments_enabled && config.checkout_url ? (
              <button className="btn-primary mt-4 w-full" onClick={pay} disabled={phase === "waiting"}>
                Pay &amp; unlock — {config.price_label}
              </button>
            ) : (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Payments aren’t configured on this deployment yet. If you’ve been
                granted access, enter your email and choose “I already paid.”
              </p>
            )}

            {phase === "waiting" ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-sm dark:bg-slate-800">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <span>
                  Waiting for your payment… this page unlocks automatically.
                </span>
              </div>
            ) : (
              <button
                onClick={checkNow}
                className="mt-3 w-full text-sm font-semibold text-brand hover:underline"
              >
                I already paid — unlock now
              </button>
            )}

            {phase === "error" && message && (
              <p className="mt-2 text-sm text-red-600">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
