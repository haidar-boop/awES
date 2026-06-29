// A placeholder shown in place of a Pro-only section for free users.
export default function LockedCard({ title, subtitle, onUnlock, tall = false }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="mb-2">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      <div
        className={`grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 ${
          tall ? "h-56" : "h-40"
        }`}
      >
        <div className="text-center">
          <div className="text-3xl">🔒</div>
          <p className="mt-2 text-sm font-medium">Pro feature</p>
          <button onClick={onUnlock} className="btn-primary mt-3">
            Unlock full report
          </button>
        </div>
      </div>
    </div>
  );
}
