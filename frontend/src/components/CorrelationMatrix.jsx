// Correlation heatmap. For diversification, LOW correlation is good (green),
// HIGH is bad (red) -- highly correlated strategies share drawdowns.
function cellStyle(v) {
  if (v === null || v === undefined) return {};
  const t = Math.max(0, Math.min(1, Math.abs(v)));
  // green (independent) -> red (same bet)
  const rgb = v >= 0.5 ? "229, 83, 75" : v >= 0 ? "217, 164, 65" : "63, 182, 139";
  const alpha = 0.15 + 0.65 * t;
  return { backgroundColor: `rgba(${rgb}, ${alpha})` };
}

export default function CorrelationMatrix({ labels, matrix }) {
  if (!matrix?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center font-mono text-xs tabular-nums">
        <thead>
          <tr>
            <th className="p-2" />
            {labels.map((l, i) => (
              <th key={i} className="p-2 font-medium uppercase tracking-label text-txt-muted">
                {short(l, i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th className="whitespace-nowrap p-2 text-left font-medium uppercase tracking-label text-txt-muted">
                {short(labels[i], i)}
              </th>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="border border-slate-200/60 p-2 font-semibold text-slate-900 dark:border-ink-edge dark:text-txt"
                  style={i === j ? { backgroundColor: "rgba(88,166,255,0.12)" } : cellStyle(v)}
                >
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function short(label, i) {
  // keep the header compact
  return (label || `S${i + 1}`).length > 10 ? `S${i + 1}` : label || `S${i + 1}`;
}
