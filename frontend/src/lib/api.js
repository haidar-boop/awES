// Thin API client. Uses relative /api paths so the same build works whether
// served by FastAPI directly or proxied by Vite in dev.

const LICENSE_KEY = "brc:license";

// Attach the stored license key so the SERVER can decide the tier. We never
// send a "tier" — the browser isn't trusted to grant Pro.
function licenseHeaders() {
  const key = localStorage.getItem(LICENSE_KEY);
  return key ? { "X-License-Key": key } : {};
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
    headers: { "Content-Type": "application/json", ...licenseHeaders() },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function fetchSample(name = "overfit") {
  const res = await fetch(`/api/sample?name=${encodeURIComponent(name)}`);
  return jsonOrThrow(res);
}

export async function fetchSamples() {
  const res = await fetch("/api/samples");
  return jsonOrThrow(res);
}

export async function getConfig() {
  const res = await fetch("/api/config");
  return jsonOrThrow(res);
}

export async function verifyLicense(key) {
  const res = await fetch("/api/license/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  return jsonOrThrow(res);
}

export async function downloadReport(analysis) {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...licenseHeaders() },
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
