import { useState } from "react";
import { useLicense } from "../lib/license.jsx";
import { useAnalysis } from "../lib/store.jsx";
import { analyze } from "../lib/api.js";

const PRO_FEATURES = [
  ["Deflated Sharpe Ratio", "The data-mining test — adjusts for how many variations you tried."],
  ["Backtest-overfit probability (PBO)", "How often the edge vanishes out-of-sample."],
  ["Monte Carlo simulation", "Thousands of resamples + the outcome cone chart."],
  ["Haircut Sharpe", "Multiple-testing correction (Harvey–Liu)."],
  ["Downloadable PDF report", "The shareable, audit-style deliverable."],
];

// Global unlock modal — rendered once in Layout, opened via openUnlock().
export default function UnlockModal() {
  const { config, tryKey, unlockOpen, closeUnlock } = useLicense();
  const { request, setAnalysis } = useAnalysis();
  const [keyInput, setKeyInput] = useState("");
  const [status, setStatus] = useState(null); // null | checking | ok | bad
  const [error, setError] = useState("");

  if (!unlockOpen) return null;

  async function activate() {
    setStatus("checking");
    setError("");
    try {
      const r = await tryKey(keyInput);
      if (r.valid && r.tier === "pro") {
        setStatus("ok");
        // Re-run the last analysis as Pro so the full report appears.
        if (request) {
          try {
            const res = await analyze(request);
            setAnalysis(res);
          } catch {
            /* keep the success state; user can re-run manually */
          }
        }
        setTimeout(() => {
          closeUnlock();
          setStatus(null);
          setKeyInput("");
        }, 1200);
      } else {
        setStatus("bad");
        setError(
          r.reason === "expired"
            ? "That key has expired."
            : "That key isn't valid. Double-check it and try again."
        );
      }
    } catch {
      setStatus("bad");
      setError("Couldn't verify the key. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={closeUnlock}
    >
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">Unlock the full report</h2>
          <button onClick={closeUnlock} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
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

        {status === "ok" ? (
          <div className="mt-5 rounded-lg border border-green-600/40 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
            ✓ Pro unlocked! Loading your full report…
          </div>
        ) : (
          <>
            {config.payments_enabled && config.checkout_url && (
              <a
                href={config.checkout_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-5 w-full"
              >
                Get Pro — {config.price_label}
              </a>
            )}

            <div className="mt-5">
              <label className="label">
                {config.payments_enabled ? "Already have a key?" : "Enter your license key"}
              </label>
              <p className="mb-2 text-xs text-slate-500">
                After purchase you’ll receive a license key by email. Paste it here
                to activate Pro on this device.
              </p>
              <div className="flex gap-2">
                <input
                  className="input font-mono text-xs"
                  placeholder="brc_…"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                />
                <button
                  className="btn-primary shrink-0"
                  disabled={!keyInput.trim() || status === "checking"}
                  onClick={activate}
                >
                  {status === "checking" ? "…" : "Activate"}
                </button>
              </div>
              {status === "bad" && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
