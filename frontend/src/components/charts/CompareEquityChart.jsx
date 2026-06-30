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
import ChartCard, { AXIS, GRID, C } from "./ChartCard.jsx";

// Overlay the two strategies' equity curves on one axis.
export default function CompareEquityChart({ aName, bName, a, b }) {
  const len = Math.max(a?.length || 0, b?.length || 0);
  const rows = Array.from({ length: len }, (_, i) => ({
    x: i,
    a: a?.[i] ?? null,
    b: b?.[i] ?? null,
  }));
  return (
    <ChartCard title="Equity curves" subtitle="Growth of 1 unit — both strategies">
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
          <Line type="monotone" dataKey="a" name={aName} stroke={C.data} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="b" name={bName} stroke={C.caution} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
