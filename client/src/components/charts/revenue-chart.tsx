import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart as ChartJS, Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueChart() {
  const { data: revenues } = useQuery({
    queryKey: ["/api/revenues"],
  });

  // Transform data for chart
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  
  // Process actual revenue data for the chart
  const monthlyData = Array(12).fill(0);
  if (revenues && Array.isArray(revenues)) {
    revenues.forEach((revenue: any) => {
      if (revenue.month >= 1 && revenue.month <= 12) {
        monthlyData[revenue.month - 1] += parseFloat(revenue.amount) / 1000000; // Convert to millions
      }
    });
  }

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Doanh thu (triệu VNĐ)',
        data: monthlyData,
        backgroundColor: '#8B4513',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + ' triệu';
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tỷ lệ doanh thu hàng tháng</CardTitle>
        <p className="text-sm text-gray-600">So sánh doanh thu và lợi nhuận</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
