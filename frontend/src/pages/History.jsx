import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useAnalysis } from "../lib/store.jsx";
import { listSaved, loadSaved, deleteSaved } from "../lib/saved.js";
import { pct, num, VERDICT_META } from "../lib/format.js";

function SignInGate({ onSignIn }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-txt">
        Sign in to see your saved analyses
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-txt-muted">
        Your history is tied to your account. Sign in (or create one) to view and
        re-open the reports you’ve saved.
      </p>
      <button className="btn-primary mt-4" onClick={onSignIn}>
        Sign in
      </button>
    </div>
  );
}

export default function History() {
  const { client, isAuthed, config, openUnlock } = useAuth();
  const { setAnalysis, setRequest } = useAnalysis();
  const nav = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!client || !isAuthed) return;
    setError(null);
    const { data, error } = await listSaved(client);
    if (error) {
      setError(
        /relation|does not exist|schema cache/i.test(error.message || "")
          ? "History storage isn’t set up on this deployment yet."
          : error.message
      );
      setItems([]);
      return;
    }
    setItems(data || []);
  }, [client, isAuthed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function open(id) {
    setBusy(true);
    try {
      const { data, error } = await loadSaved(client, id);
      if (error || !data?.payload) throw new Error(error?.message || "Could not load that analysis.");
      setRequest(null);
      setAnalysis(data.payload);
      nav("/results");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    const { error } = await deleteSaved(client, id);
    setBusy(false);
    if (error) setError(error.message);
    else setItems((xs) => (xs || []).filter((x) => x.id !== id));
  }

  if (!config.auth_enabled) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-slate-600 dark:text-txt-muted">
          Accounts aren’t configured on this deployment yet.
        </p>
      </div>
    );
  }

  if (!isAuthed) return <SignInGate onSignIn={openUnlock} />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-txt">
        Saved analyses
      </h1>
      <p className="mt-1 text-slate-600 dark:text-txt-muted">
        Your saved reports. Open one to view it again, or remove it.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {error}
        </div>
      )}

      {items === null && (
        <p className="mt-6 font-mono text-sm uppercase tracking-label text-txt-muted">Loading…</p>
      )}

      {items !== null && items.length === 0 && !error && (
        <div className="card mt-6 p-8 text-center">
          <p className="text-slate-600 dark:text-txt-muted">
            No saved analyses yet. Run a report and hit <strong>Save</strong> to
            keep it here.
          </p>
          <button className="btn-primary mt-4" onClick={() => nav("/analyze")}>
            Analyze a strategy
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {(items || []).map((it) => {
          const s = it.summary || {};
          const m = VERDICT_META[s.level] || VERDICT_META.yellow;
          return (
            <div key={it.id} className="card relative overflow-hidden">
              <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: m.accent }} aria-hidden="true" />
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label ${m.chip}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.accent }} />
                      {m.code}
                    </span>
                    <span className="truncate font-semibold text-slate-900 dark:text-txt">
                      {it.name || s.headline}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500 dark:text-txt-muted">
                    {new Date(it.created_at).toLocaleString()} · {s.n ?? "?"} obs ·
                    {" "}return {pct(s.total_return)} · Sharpe {num(s.sharpe)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button className="btn-primary" onClick={() => open(it.id)} disabled={busy}>
                    Open
                  </button>
                  <button className="btn-ghost" onClick={() => remove(it.id)} disabled={busy} title="Delete">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
