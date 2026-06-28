import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartCard, { AXIS, GRID } from "./ChartCard.jsx";

export default function EquityChart({ data }) {
  const rows = data.x.map((x, i) => ({
    x,
    strategy: data.strategy[i],
    benchmark: data.benchmark ? data.benchmark[i] : null,
  }));
  return (
    <ChartCard
      title="Equity curve"
      subtitle="Growth of 1 unit — strategy vs. buy & hold"
    >
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="x" tick={AXIS} />
          <YAxis tick={AXIS} width={48} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => (v == null ? "n/a" : Number(v).toFixed(3))}
            labelFormatter={(l) => `Period ${l}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="strategy"
            name="Strategy"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
          />
          {data.benchmark && (
            <Line
              type="monotone"
              dataKey="benchmark"
              name="Buy & hold"
              stroke="#94a3b8"
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
