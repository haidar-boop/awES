export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-4">
      <div className="mb-2">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export const AXIS = { fontSize: 11, stroke: "#94a3b8" };
export const GRID = "#33415533";
