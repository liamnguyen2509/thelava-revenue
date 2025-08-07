import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart as ChartJS } from "react-chartjs-2";
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

// Register the Chart as a mixed chart
const MixedChart = Chart;

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
  
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Doanh thu',
        data: [120, 135, 142, 158, 165, 172, 180, 185, 178, 182, 180, 190], // Mock data - replace with real data
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        type: 'bar' as const,
      },
      {
        label: 'Lợi nhuận',
        data: [65, 72, 78, 82, 85, 88, 90, 92, 88, 90, 85, 95], // Mock data - replace with real data
        type: 'line' as const,
        borderColor: 'var(--tea-brown)',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointBackgroundColor: 'var(--tea-brown)',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
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
          <MixedChart type="bar" data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
