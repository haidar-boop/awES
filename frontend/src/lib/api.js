// Thin API client. Uses relative /api paths so the same build works whether
// served by FastAPI directly or proxied by Vite in dev.

// The current Supabase access token, set by the AuthProvider. The SERVER
// validates it and decides the tier — the browser never claims Pro itself.
let _authToken = null;
export function setAuthToken(token) {
  _authToken = token || null;
}
function authHeaders() {
  return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
}

async function jsonOrThrow(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function analyze(payload) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function fetchSample(name = "overfit") {
  return jsonOrThrow(await fetch(`/api/sample?name=${encodeURIComponent(name)}`));
}

export async function fetchSamples() {
  return jsonOrThrow(await fetch("/api/samples"));
}

// Upload a broker / platform export (MT4/MT5 HTML, TradingView/MT5 XLSX, cTrader
// or generic CSV); the server returns the extracted P&L / equity column as text.
export async function importStatement(file) {
  const form = new FormData();
  form.append("file", file);
  return jsonOrThrow(await fetch("/api/import", { method: "POST", body: form }));
}

export async function getConfig() {
  return jsonOrThrow(await fetch("/api/config"));
}

export async function getMe() {
  return jsonOrThrow(await fetch("/api/auth/me", { headers: { ...authHeaders() } }));
}

export async function analyzeStrategyCode({ code, language, context }) {
  const res = await fetch("/api/ai/analyze-strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ code, language, context }),
  });
  return jsonOrThrow(res); // throws with .status (402 = needs Pro, 429 = limit)
}

export async function downloadReport(analysis) {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ analysis }),
  });
  if (res.status === 402) {
    const err = new Error("The PDF report is a Pro feature.");
    err.status = 402;
    throw err;
  }
  if (!res.ok) throw new Error("Could not generate the PDF report.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backtest-reality-check.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
