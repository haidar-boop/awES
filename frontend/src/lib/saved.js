// Saved analyses (per-user history) via the Supabase client + Row-Level
// Security. All access is the signed-in user's own rows only — RLS enforces it
// server-side, so there's no way to read someone else's saved data.
//
// The table is created by supabase/saved_analyses.sql. If it doesn't exist yet
// these calls return a Postgres error, which the UI surfaces as a setup note
// instead of crashing.

const TABLE = "saved_analyses";

// Monte Carlo keeps 2000-long sample arrays we don't need to re-render a saved
// report (the cone + summaries are stored separately). Drop them to keep rows
// lean.
function trimPayload(analysis) {
  const a = { ...analysis };
  if (a.monte_carlo) {
    const mc = { ...a.monte_carlo };
    delete mc.final_return_samples;
    delete mc.max_drawdown_samples;
    a.monte_carlo = mc;
  }
  return a;
}

export function summarize(analysis) {
  return {
    level: analysis?.verdict?.level || "yellow",
    headline: analysis?.verdict?.headline || "Analysis",
    total_return: analysis?.stats?.total_return ?? null,
    sharpe: analysis?.stats?.sharpe_annualized ?? null,
    n: analysis?.meta?.n_observations ?? null,
    frequency: analysis?.meta?.frequency || "",
    tier: analysis?.meta?.tier || "free",
  };
}

export async function saveAnalysis(client, name, analysis) {
  return client
    .from(TABLE)
    .insert({ name, summary: summarize(analysis), payload: trimPayload(analysis) })
    .select("id")
    .single();
}

export async function listSaved(client) {
  return client
    .from(TABLE)
    .select("id,name,created_at,summary")
    .order("created_at", { ascending: false });
}

export async function loadSaved(client, id) {
  return client.from(TABLE).select("payload").eq("id", id).single();
}

export async function deleteSaved(client, id) {
  return client.from(TABLE).delete().eq("id", id);
}
