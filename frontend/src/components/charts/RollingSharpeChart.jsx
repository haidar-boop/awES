import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import ChartCard, { AXIS, GRID } from "./ChartCard.jsx";

export default function RollingSharpeChart({ data }) {
  const rows = data.x.map((x, i) => ({ x, sharpe: data.sharpe[i] }));
  return (
    <ChartCard
      title="Rolling Sharpe"
      subtitle={`Annualized Sharpe over a ${data.window}-period window — stability matters`}
    >
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="x" tick={AXIS} />
          <YAxis tick={AXIS} width={40} />
          <Tooltip
            formatter={(v) => (v == null ? "n/a" : Number(v).toFixed(2))}
            labelFormatter={(l) => `Period ${l}`}
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="sharpe"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
