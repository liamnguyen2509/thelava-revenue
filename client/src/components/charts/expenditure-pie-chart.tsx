import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpenditurePieChartProps {
  data: { [key: string]: number };
}

const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#F97316'];

export default function ExpenditurePieChart({ data }: ExpenditurePieChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key, // Use the actual account name directly
      value: value,
      key: key
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>Chưa có dữ liệu chi tiêu</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `${Math.round(value).toLocaleString('vi-VN').replace(/,/g, '.')} VNĐ`;
  };

  const renderCustomizedLabel = ({ percent }: any) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}