import { useEffect, useState } from "react";

// A three-zone diagnostic gauge (overfit | inconclusive | robust). The needle
// calibrates from centre to the verdict zone on mount — a measurement sweep,
// not decoration. `zone` is 0..1 (0 = overfit, 1 = robust).
export default function VerdictGauge({ zone = 0.5, accent = "#8B97A6", size = 132 }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const cx = 100;
  const cy = 100;
  const r = 78;
  // math angle (deg, CCW from +x): zone 0 -> 180 (left), zone 1 -> 0 (right)
  const target = 180 - 180 * Math.max(0, Math.min(1, zone));
  // SVG rotate is clockwise; needle is drawn pointing right (angle 0)
  const rot = armed ? -target : -90;

  const arc = (a0, a1) => {
    const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };

  return (
    <svg viewBox="0 0 200 116" width={size} height={size * 0.58} role="img" aria-hidden="true">
      {/* zone arcs */}
      <path d={arc(180, 122)} fill="none" stroke="#E5534B" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
      <path d={arc(118, 62)} fill="none" stroke="#D9A441" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
      <path d={arc(58, 0)} fill="none" stroke="#3FB68B" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
      {/* ticks */}
      {[180, 135, 90, 45, 0].map((a) => {
        const o = (a * Math.PI) / 180;
        const r0 = r - 11;
        const r1 = r - 3;
        return (
          <line
            key={a}
            x1={cx + r0 * Math.cos(o)} y1={cy - r0 * Math.sin(o)}
            x2={cx + r1 * Math.cos(o)} y2={cy - r1 * Math.sin(o)}
            stroke="#8B97A6" strokeOpacity="0.4" strokeWidth="1.5"
          />
        );
      })}
      {/* needle */}
      <g
        style={{
          transform: `rotate(${rot}deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <line x1={cx} y1={cy} x2={cx + r - 8} y2={cy} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r="6.5" fill="#0D1117" stroke={accent} strokeWidth="2" />
    </svg>
  );
}
