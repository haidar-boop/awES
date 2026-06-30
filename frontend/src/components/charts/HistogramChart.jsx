import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartCard, { AXIS, GRID } from "./ChartCard.jsx";

export default function HistogramChart({ data }) {
  const rows = data.bins.map((b) => ({
    center: (b.center * 100).toFixed(2),
    count: b.count,
    normal: b.normal,
  }));
  return (
    <ChartCard
      title="Return distribution"
      subtitle="Histogram of per-period returns with a normal-curve overlay"
    >
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="center" tick={AXIS} unit="%" />
          <YAxis tick={AXIS} width={40} />
          <Tooltip labelFormatter={(l) => `Return ${l}%`} />
          <Legend />
          <Bar dataKey="count" name="Observed" fill="#58A6FF" fillOpacity={0.65} />
          <Line
            type="monotone"
            dataKey="normal"
            name="If normal"
            stroke="#D9A441"
            dot={false}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
