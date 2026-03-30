import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpendingPieChartProps {
  data: Array<{ categoryName: string; color: string; amount: number }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { categoryName: string; color: string; amount: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-medium">{item.payload.categoryName}</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="categoryName"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span className="text-sm text-[var(--color-text)]">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
