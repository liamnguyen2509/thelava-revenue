import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Wallet, PieChart } from "lucide-react";
import ReserveAllocationModal from "@/components/modals/reserve-allocation-modal";
import ReserveAllocationChart from "@/components/charts/reserve-allocation-chart";
import type { ReserveAllocation, AllocationAccount } from "@shared/schema";

interface SummaryData {
  total: number;
  byAccount: { [key: string]: number };
}

const accountTypeLabels: { [key: string]: string } = {
  reinvestment: "Tái đầu tư",
  depreciation: "Khấu hao", 
  risk_reserve: "Dự phòng rủi ro",
  staff_bonus: "Thưởng nhân viên",
  dividends: "Cổ tức",
  marketing: "Marketing",
};

const accountTypeColors: { [key: string]: string } = {
  reinvestment: "bg-green-100 text-green-800",
  depreciation: "bg-yellow-100 text-yellow-800",
  risk_reserve: "bg-red-100 text-red-800", 
  staff_bonus: "bg-blue-100 text-blue-800",
  dividends: "bg-purple-100 text-purple-800",
  marketing: "bg-orange-100 text-orange-800",
};

export default function ReserveFunds() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: allocations } = useQuery<ReserveAllocation[]>({
    queryKey: ["/api/reserve-allocations", selectedYear],
    queryFn: () => fetch(`/api/reserve-allocations?year=${selectedYear}`).then(res => res.json()),
  });

  const { data: summary } = useQuery<SummaryData>({
    queryKey: ["/api/reserve-allocations/summary"],
  });

  const { data: allocationAccounts } = useQuery<AllocationAccount[]>({
    queryKey: ["/api/settings/allocation-accounts"],
  });

  const formatCurrency = (amount: string | number) => {
    return parseFloat(amount.toString()).toLocaleString('vi-VN');
  };

  const formatMonth = (month: number) => {
    return `Tháng ${month}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý quỹ dự trữ</h1>
          <p className="text-gray-600">Theo dõi và quản lý các quỹ dự trữ theo từng loại tài khoản</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm phân bổ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quỹ dự trữ</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total ? formatCurrency(summary.total) : "0"} VNĐ
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng các quỹ đã phân bổ năm {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số loại quỹ</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.byAccount ? Object.keys(summary.byAccount).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Loại quỹ đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tài khoản phân bổ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allocationAccounts ? allocationAccounts.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tài khoản được cấu hình
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReserveAllocationChart />
        
        {/* Recent Allocations */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ gần đây</CardTitle>
            <div className="flex items-center space-x-2">
              <select 
                className="text-sm border rounded px-2 py-1"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {allocations && allocations.length > 0 ? (
              <div className="space-y-3">
                {allocations.slice(0, 5).map((allocation: ReserveAllocation) => (
                  <div key={allocation.id} className="flex justify-between items-center">
                    <div>
                      <Badge className={accountTypeColors[allocation.accountType] || "bg-gray-100 text-gray-800"}>
                        {accountTypeLabels[allocation.accountType] || allocation.accountType}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatMonth(allocation.month)} {allocation.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(allocation.amount)} VNĐ</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Chưa có phân bổ nào cho năm {selectedYear}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Allocations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết phân bổ quỹ dự trữ</CardTitle>
        </CardHeader>
        <CardContent>
          {allocations && allocations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại tài khoản</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation: ReserveAllocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      {formatMonth(allocation.month)} {allocation.year}
                    </TableCell>
                    <TableCell>
                      <Badge className={accountTypeColors[allocation.accountType] || "bg-gray-100 text-gray-800"}>
                        {accountTypeLabels[allocation.accountType] || allocation.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(allocation.amount)} VNĐ
                    </TableCell>
                    <TableCell>
                      {new Date(allocation.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Chưa có phân bổ quỹ dự trữ nào</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo phân bổ đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ReserveAllocationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
