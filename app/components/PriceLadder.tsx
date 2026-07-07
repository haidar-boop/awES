import { formatCad } from '@/lib/core/pricing';
import { formatDate } from '@/lib/utils';

interface Point {
  price: number;
  at: string;
}

/**
 * The markdown-ladder timeline (spec §4.3): $24.98 → $6.03 → $3.02 → $0.01.
 * Lightweight inline SVG — no chart library needed for a step-down series.
 */
export function PriceLadder({ points }: { points: Point[] }) {
  if (points.length < 2) return null;
  const w = 640;
  const h = 160;
  const pad = 24;
  const max = Math.max(...points.map((p) => p.price));
  const min = 0;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (price: number) => pad + (1 - (price - min) / (max - min || 1)) * (h - pad * 2);

  // Step-down path
  let d = `M ${x(0)} ${y(points[0].price)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` H ${x(i)} V ${y(points[i].price)}`;
  }

  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={`Price history: ${points.map((p) => formatCad(p.price)).join(' → ')}`}
      >
        <path d={d} fill="none" stroke="#B87333" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.price)} r="4" fill="#B87333" />
            <text
              x={x(i)}
              y={y(p.price) - 9}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              className="fill-stone-600 text-[11px] font-semibold dark:fill-stone-300"
            >
              {formatCad(p.price)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-stone-400">
        <span>{formatDate(points[0].at)}</span>
        <span>{formatDate(points[points.length - 1].at)}</span>
      </figcaption>
    </figure>
  );
}
