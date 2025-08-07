import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const accountTypeLabels: { [key: string]: string } = {
  reinvestment: "Tái đầu tư",
  depreciation: "Khấu hao",
  risk_reserve: "Dự phòng rủi ro", 
  staff_bonus: "Thưởng nhân viên",
  dividends: "Cổ tức",
  marketing: "Marketing",
};

const accountTypeColors: { [key: string]: string } = {
  reinvestment: "#8B4513",
  depreciation: "#CD853F", 
  risk_reserve: "#DEB887",
  staff_bonus: "#F4A460",
  dividends: "#D2691E",
  marketing: "#BC8F8F",
};

interface SummaryData {
  total: number;
  byAccount: { [key: string]: number };
}

export default function ReserveAllocationChart() {
  const { data: summary } = useQuery<SummaryData>({
    queryKey: ["/api/reserve-allocations/summary"],
  });

  if (!summary || !summary.byAccount || Object.keys(summary.byAccount).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ quỹ dự trữ theo loại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            Chưa có dữ liệu phân bổ quỹ dự trữ
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: Object.keys(summary.byAccount).map(type => accountTypeLabels[type] || type),
    datasets: [
      {
        data: Object.values(summary.byAccount),
        backgroundColor: Object.keys(summary.byAccount).map(type => accountTypeColors[type] || '#8B4513'),
        borderWidth: 2,
        borderColor: '#FFFFFF',
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString('vi-VN')} VNĐ (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ quỹ dự trữ theo loại</CardTitle>
        <p className="text-sm text-gray-600">
          Tổng: {summary.total.toLocaleString('vi-VN')} VNĐ
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}