import { useState } from "react";
import { pct, num, int } from "../lib/format.js";

const VC = {
  red: { bar: "#dc2626", label: "Likely overfit" },
  yellow: { bar: "#d97706", label: "Inconclusive" },
  green: { bar: "#16a34a", label: "Holds up so far" },
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = (text || "").split(/\s+/);
  let line = "";
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
      if (++lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

// Draws a 1200x630 (social-card sized) branded verdict image on a canvas.
function drawCard(analysis) {
  const { verdict, stats, sharpe, meta } = analysis;
  const meta_v = VC[verdict.level] || VC.yellow;
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);
  // top accent bar in verdict color
  ctx.fillStyle = meta_v.bar;
  ctx.fillRect(0, 0, W, 12);

  const PAD = 64;

  // brand
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Inter, Arial, sans-serif";
  ctx.fillText("TrueSharpe", PAD, 84);
  ctx.fillStyle = "#60a5fa";
  ctx.font = "500 22px Inter, Arial, sans-serif";
  ctx.fillText("backtest reality check", PAD + 220, 84);

  // verdict dot + headline
  ctx.beginPath();
  ctx.arc(PAD + 22, 178, 22, 0, Math.PI * 2);
  ctx.fillStyle = meta_v.bar;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px Inter, Arial, sans-serif";
  ctx.fillText(verdict.headline || meta_v.label, PAD + 64, 196);

  // summary
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "400 26px Inter, Arial, sans-serif";
  wrapText(ctx, verdict.summary || "", PAD, 252, W - PAD * 2, 38, 3);

  // stat tiles
  const tiles = [
    ["Total return", pct(stats.total_return)],
    ["Ann. Sharpe", num(stats.sharpe_annualized)],
    ["Max drawdown", pct(stats.max_drawdown)],
    ["PSR", pct(sharpe.psr)],
  ];
  const tileW = (W - PAD * 2 - 36) / 4;
  tiles.forEach((t, i) => {
    const x = PAD + i * (tileW + 12);
    const y = 396;
    ctx.fillStyle = "#111a2e";
    ctx.fillRect(x, y, tileW, 110);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 18px Inter, Arial, sans-serif";
    ctx.fillText(t[0].toUpperCase(), x + 18, y + 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 38px Inter, Arial, sans-serif";
    ctx.fillText(String(t[1]), x + 18, y + 82);
  });

  // meta line
  ctx.fillStyle = "#64748b";
  ctx.font = "400 20px Inter, Arial, sans-serif";
  ctx.fillText(
    `${int(meta.n_observations)} observations · ${meta.frequency} · ${int(meta.num_trials)} trial(s) tested`,
    PAD, 556
  );

  // footer
  ctx.fillStyle = "#60a5fa";
  ctx.font = "600 22px Inter, Arial, sans-serif";
  ctx.fillText("truesharpe.com", PAD, 596);
  ctx.fillStyle = "#475569";
  ctx.font = "400 18px Inter, Arial, sans-serif";
  ctx.fillText("Statistical robustness check — not financial advice.", PAD + 200, 596);

  return canvas;
}

export default function ShareCard({ analysis }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function share() {
    setBusy(true);
    setDone(false);
    try {
      const canvas = drawCard(analysis);
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const file = new File([blob], "truesharpe-verdict.png", { type: "image/png" });
      const text = `My backtest got a "${analysis.verdict.headline}" verdict on TrueSharpe.`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "TrueSharpe verdict", text });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "truesharpe-verdict.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }
    } catch {
      /* user cancelled share, or unsupported — ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn-ghost" onClick={share} disabled={busy} title="Share or save a result image">
      {busy ? "…" : done ? "Saved ✓" : "Share result"}
    </button>
  );
}
