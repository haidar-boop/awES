import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartCard, { AXIS, GRID } from "./ChartCard.jsx";

// Build stacked areas: base = p5, then bands as deltas so the fills stack into
// a proper cone (5–95 outer, 25–75 inner).
export default function MonteCarloChart({ data }) {
  const rows = data.x.map((x, i) => {
    const p5 = data.p5[i];
    const p25 = data.p25[i];
    const p75 = data.p75[i];
    const p95 = data.p95[i];
    return {
      x,
      base: p5,
      band5_25: p25 - p5,
      band25_75: p75 - p25,
      band75_95: p95 - p75,
      median: data.p50[i],
      actual: data.actual[i],
    };
  });
  return (
    <ChartCard
      title="Monte Carlo cone"
      subtitle="Percentile bands across thousands of resamples; red = your actual path"
    >
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="x" tick={AXIS} />
          <YAxis tick={AXIS} width={48} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => (v == null ? "" : Number(v).toFixed(3))}
            labelFormatter={(l) => `Period ${l}`}
          />
          <Legend />
          <Area dataKey="base" stackId="cone" stroke="none" fill="transparent" legendType="none" name=" " />
          <Area dataKey="band5_25" stackId="cone" stroke="none" fill="#58A6FF" fillOpacity={0.12} name="5–95%" />
          <Area dataKey="band25_75" stackId="cone" stroke="none" fill="#58A6FF" fillOpacity={0.26} name="25–75%" />
          <Area dataKey="band75_95" stackId="cone" stroke="none" fill="#58A6FF" fillOpacity={0.12} legendType="none" name=" " />
          <Line type="monotone" dataKey="median" name="Median" stroke="#58A6FF" dot={false} strokeWidth={1} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="actual" name="Actual" stroke="#E5534B" dot={false} strokeWidth={2.2} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
