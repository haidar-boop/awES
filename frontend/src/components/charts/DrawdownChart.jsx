import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartCard, { AXIS, GRID } from "./ChartCard.jsx";

export default function DrawdownChart({ data }) {
  const rows = data.x.map((x, i) => ({
    x,
    dd: (data.drawdown[i] ?? 0) * 100,
  }));
  return (
    <ChartCard title="Drawdown" subtitle="How far below the prior peak (%)">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="x" tick={AXIS} />
          <YAxis tick={AXIS} width={48} unit="%" />
          <Tooltip
            formatter={(v) => `${Number(v).toFixed(1)}%`}
            labelFormatter={(l) => `Period ${l}`}
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke="#dc2626"
            fill="#dc2626"
            fillOpacity={0.3}
            strokeWidth={1.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
