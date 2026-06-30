export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-4">
      <div className="mb-2">
        <h3 className="font-display font-semibold tracking-tight text-slate-900 dark:text-txt">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-txt-muted">{subtitle}</p>
        )}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

// Instrument chart tokens
export const AXIS = { fontSize: 11, stroke: "#8B97A6" };
export const GRID = "#262D3866";
export const C = {
  data: "#58A6FF", // strategy / primary series, axes highlights
  muted: "#8B97A6", // benchmark / neutral
  robust: "#3FB68B",
  caution: "#D9A441",
  overfit: "#E5534B",
};
