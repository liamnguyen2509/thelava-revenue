import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function CashFlowChart() {
  const { data: revenues } = useQuery({
    queryKey: ["/api/revenues"],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Transform data for chart
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Doanh thu',
        data: [120, 135, 142, 158, 165, 172, 180, 185, 178, 182, 180, 190], // Mock data - replace with real data
        backgroundColor: 'var(--tea-brown)',
        borderRadius: 4,
      },
      {
        label: 'Lợi nhuận ròng',
        data: [65, 72, 78, 82, 85, 88, 90, 92, 88, 90, 85, 95], // Mock data - replace with real data
        backgroundColor: 'var(--tea-light)',
        borderRadius: 4,
      },
      {
        label: 'Lương nhân viên',
        data: [25, 25, 25, 28, 28, 30, 30, 30, 30, 32, 32, 32], // Mock data - replace with real data
        backgroundColor: '#FCA5A5',
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
        <CardTitle>Biến động dòng tiền</CardTitle>
        <p className="text-sm text-gray-600">Theo dõi dòng tiền theo tháng</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
