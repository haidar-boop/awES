// Thin API client. Uses relative /api paths so the same build works whether
// served by FastAPI directly or proxied by Vite in dev.

async function jsonOrThrow(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function analyze(payload) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function downloadReport(analysis) {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis }),
  });
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
