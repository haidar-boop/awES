// A placeholder shown in place of a Pro-only section for free users.
function LockGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" stroke="#8B97A6" strokeWidth="1.7" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="#8B97A6" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function LockedCard({ title, subtitle, onUnlock, tall = false }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="mb-2">
        <h3 className="font-semibold text-slate-900 dark:text-txt">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-txt-muted">{subtitle}</p>
        )}
      </div>
      <div
        className={`grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-ink-edge dark:bg-ink-deep/60 ${
          tall ? "h-56" : "h-40"
        }`}
      >
        <div className="text-center">
          <div className="flex justify-center">
            <LockGlyph />
          </div>
          <p className="mono-label mt-2">Pro feature</p>
          <button onClick={onUnlock} className="btn-primary mt-3">
            Unlock full report
          </button>
        </div>
      </div>
    </div>
  );
}
