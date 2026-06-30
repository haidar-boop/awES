import { useState } from "react";
import { pct, num, int } from "../lib/format.js";

const VC = {
  red: { bar: "#E5534B", label: "Likely overfit" },
  yellow: { bar: "#D9A441", label: "Inconclusive" },
  green: { bar: "#3FB68B", label: "Holds up so far" },
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

  const SANS = "'IBM Plex Sans', Inter, Arial, sans-serif";
  const MONO = "'IBM Plex Mono', ui-monospace, monospace";

  // background — instrument graphite
  ctx.fillStyle = "#0D1117";
  ctx.fillRect(0, 0, W, H);
  // top accent bar in verdict color
  ctx.fillStyle = meta_v.bar;
  ctx.fillRect(0, 0, W, 8);

  const PAD = 64;

  // brand
  ctx.fillStyle = "#E6EDF3";
  ctx.font = `700 34px ${SANS}`;
  ctx.fillText("TrueSharpe", PAD, 84);
  ctx.fillStyle = "#8B97A6";
  ctx.font = `500 16px ${MONO}`;
  ctx.fillText("BACKTEST REALITY CHECK", PAD + 218, 81);

  // verdict tag
  ctx.fillStyle = "#8B97A6";
  ctx.font = `600 18px ${MONO}`;
  ctx.fillText("VERDICT", PAD, 150);
  ctx.beginPath();
  ctx.arc(PAD + 20, 188, 13, 0, Math.PI * 2);
  ctx.fillStyle = meta_v.bar;
  ctx.fill();
  ctx.fillStyle = "#E6EDF3";
  ctx.font = `700 48px ${SANS}`;
  ctx.fillText(verdict.headline || meta_v.label, PAD + 48, 204);

  // summary
  ctx.fillStyle = "#8B97A6";
  ctx.font = `400 25px ${SANS}`;
  wrapText(ctx, verdict.summary || "", PAD, 256, W - PAD * 2, 37, 3);

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
    ctx.fillStyle = "#161B22";
    ctx.fillRect(x, y, tileW, 110);
    ctx.strokeStyle = "#262D38";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, tileW - 1, 109);
    ctx.fillStyle = "#8B97A6";
    ctx.font = `600 15px ${MONO}`;
    ctx.fillText(t[0].toUpperCase(), x + 18, y + 36);
    ctx.fillStyle = "#E6EDF3";
    ctx.font = `600 38px ${MONO}`;
    ctx.fillText(String(t[1]), x + 18, y + 84);
  });

  // meta line
  ctx.fillStyle = "#5c6775";
  ctx.font = `400 18px ${MONO}`;
  ctx.fillText(
    `${int(meta.n_observations)} observations · ${meta.frequency} · ${int(meta.num_trials)} trial(s) tested`,
    PAD, 556
  );

  // footer
  ctx.fillStyle = "#58A6FF";
  ctx.font = `600 22px ${SANS}`;
  ctx.fillText("truesharpe.com", PAD, 596);
  ctx.fillStyle = "#5c6775";
  ctx.font = `400 18px ${SANS}`;
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
      // Make sure the brand fonts are loaded before rasterizing the card.
      try {
        await document.fonts?.ready;
      } catch {
        /* fonts API unavailable — fall back to whatever is loaded */
      }
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
