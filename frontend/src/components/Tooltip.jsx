import { useState, useRef } from "react";

// Lightweight hover/focus tooltip — no dependency, works on touch via tap.
export default function Tooltip({ text, children }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        tabIndex={0}
        onClick={() => {
          setOpen((o) => !o);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setOpen(false), 4000);
        }}
        className="ml-1 grid h-4 w-4 place-items-center rounded-full border border-slate-400 font-mono text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:border-ink-edge dark:text-txt-muted dark:hover:bg-ink-elevated"
        aria-label="More info"
      >
        ?
      </button>
      {children}
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-40 w-64 -translate-x-1/2 rounded-md border border-ink-edge bg-ink-elevated px-3 py-2 text-left text-xs font-normal leading-relaxed text-txt shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
