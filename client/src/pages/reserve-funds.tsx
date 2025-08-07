import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, TrendingUp, Wallet, PieChart, Edit, Trash2, 
  DollarSign, Target, AlertTriangle, Users 
} from "lucide-react";
import ReserveAllocationModal from "@/components/modals/reserve-allocation-modal";
import ReserveExpenditureModal from "@/components/modals/reserve-expenditure-modal";
import ConfirmDeleteModal from "@/components/modals/confirm-delete-modal";
import ExpenditurePieChart from "@/components/charts/expenditure-pie-chart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReserveAllocation, AllocationAccount, ReserveExpenditure, SystemSetting } from "@shared/schema";

interface SummaryData {
  total: number;
  byAccount: { [key: string]: number };
}

interface ExpenditureSummaryData {
  totalExpended: number;
  byAccount: { [key: string]: number };
  monthlyExpenditure: { [month: number]: { [account: string]: number } };
}

const accountTypeLabels: { [key: string]: string } = {
  reinvestment: "Tái đầu tư",
  depreciation: "Khấu hao", 
  risk_reserve: "Rủi ro",
  staff_bonus: "Lương thưởng",
};

const accountTypeColors: { [key: string]: string } = {
  reinvestment: "bg-green-100 text-green-800",
  depreciation: "bg-yellow-100 text-yellow-800",
  risk_reserve: "bg-red-100 text-red-800", 
  staff_bonus: "bg-blue-100 text-blue-800",
};

const accountTypeIcons: { [key: string]: any } = {
  reinvestment: TrendingUp,
  depreciation: DollarSign,
  risk_reserve: AlertTriangle,
  staff_bonus: Users,
};

export default function ReserveFunds() {
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isExpenditureModalOpen, setIsExpenditureModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedExpenditure, setSelectedExpenditure] = useState<ReserveExpenditure | null>(null);
  const [selectedExpenditures, setSelectedExpenditures] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenditureToDelete, setExpenditureToDelete] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate years array like in cash flow page
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const { data: allocations } = useQuery<ReserveAllocation[]>({
    queryKey: ["/api/reserve-allocations", selectedYear],
    queryFn: () => fetch(`/api/reserve-allocations?year=${selectedYear}`).then(res => res.json()),
  });

  const { data: summary } = useQuery<SummaryData>({
    queryKey: ["/api/reserve-allocations/summary"],
  });

  const { data: expenditures } = useQuery<ReserveExpenditure[]>({
    queryKey: ["/api/reserve-expenditures", selectedYear],
    queryFn: () => fetch(`/api/reserve-expenditures?year=${selectedYear}`).then(res => res.json()),
  });

  const { data: expenditureSummary } = useQuery<ExpenditureSummaryData>({
    queryKey: ["/api/reserve-expenditures/summary", selectedYear],
    queryFn: () => fetch(`/api/reserve-expenditures/summary/${selectedYear}`).then(res => res.json()),
  });

  // Fetch system settings for currency
  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  // Fetch allocation accounts from settings
  const { data: allocationAccounts = [] } = useQuery<AllocationAccount[]>({
    queryKey: ["/api/settings/allocation-accounts"],
  });

  const deleteExpenditureMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/reserve-expenditures/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures/summary"] });
      toast({
        title: "Thành công",
        description: "Đã xóa khoản chi",
      });
    },
  });

  const deleteMultipleExpendituresMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const deletePromises = ids.map(id => 
        apiRequest(`/api/reserve-expenditures/${id}`, "DELETE")
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures/summary"] });
      setSelectedExpenditures([]);
      toast({
        title: "Thành công",
        description: "Đã xóa các khoản chi đã chọn",
      });
    },
  });

  // Get currency from settings
  const getCurrency = () => {
    const currencySetting = systemSettings.find(s => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  const formatCurrency = (amount: string | number) => {
    const currency = getCurrency();
    return Math.round(parseFloat(amount.toString())).toLocaleString('vi-VN').replace(/,/g, '.') + " " + currency;
  };

  // Function to get account name by id
  const getAccountName = (accountId: string) => {
    const account = allocationAccounts.find(acc => acc.id === accountId);
    return account ? account.name : accountId;
  };

  const formatMonth = (month: number) => {
    return `Tháng ${month}`;
  };

  const calculateActualBalance = () => {
    const totalAllocated = summary?.total || 0;
    const totalExpended = expenditureSummary?.totalExpended || 0;
    return totalAllocated - totalExpended;
  };

  const handleEditExpenditure = (expenditure: ReserveExpenditure) => {
    setSelectedExpenditure(expenditure);
    setIsExpenditureModalOpen(true);
  };

  const handleDeleteExpenditure = (id: string) => {
    setExpenditureToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (expenditureToDelete) {
      deleteExpenditureMutation.mutate(expenditureToDelete);
      setDeleteConfirmOpen(false);
      setExpenditureToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpenditures.length > 0) {
      setBulkDeleteConfirmOpen(true);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedExpenditures.length > 0) {
      deleteMultipleExpendituresMutation.mutate(selectedExpenditures);
      setBulkDeleteConfirmOpen(false);
    }
  };

  const toggleSelectExpenditure = (id: string) => {
    setSelectedExpenditures(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenditures.length === (expenditures?.length || 0)) {
      setSelectedExpenditures([]);
    } else {
      setSelectedExpenditures(expenditures?.map(exp => exp.id) || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quỹ dự trữ</h1>
          <p className="text-gray-600">Quản lý phân bổ và chi tiêu quỹ dự trữ cho tiệm</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="year">Năm:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => {
              setSelectedExpenditure(null);
              setIsExpenditureModalOpen(true);
            }}
            className="bg-tea-brown hover:bg-tea-brown/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm khoản chi
          </Button>
        </div>
      </div>

      {/* 5 Summary Cards with colors like monthly expenses page */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Tái đầu tư */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Tái đầu tư</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-900">
              {expenditureSummary?.byAccount?.reinvestment ? formatCurrency(expenditureSummary.byAccount.reinvestment) : "0"}
            </div>
            <p className="text-xs text-green-600">
              Đã chi năm {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Khấu hao */}
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Khấu hao</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-900">
              {expenditureSummary?.byAccount?.depreciation ? formatCurrency(expenditureSummary.byAccount.depreciation) : "0"}
            </div>
            <p className="text-xs text-yellow-600">
              Đã chi năm {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Rủi ro */}
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Rủi ro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-900">
              {expenditureSummary?.byAccount?.risk_reserve ? formatCurrency(expenditureSummary.byAccount.risk_reserve) : "0"}
            </div>
            <p className="text-xs text-red-600">
              Đã chi năm {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Lương thưởng */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Lương thưởng</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-900">
              {expenditureSummary?.byAccount?.staff_bonus ? formatCurrency(expenditureSummary.byAccount.staff_bonus) : "0"}
            </div>
            <p className="text-xs text-blue-600">
              Đã chi năm {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Tổng chi */}
        <Card className="border-tea-brown bg-gradient-to-br from-tea-light to-tea-cream">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-tea-brown">Tổng chi</CardTitle>
            <Wallet className="h-4 w-4 text-tea-brown" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-tea-brown">
              {expenditureSummary?.totalExpended ? formatCurrency(expenditureSummary.totalExpended) : "0"}
            </div>
            <p className="text-xs text-tea-brown/70">
              Tổng chi năm {selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Monthly Expenditure Table (2/3 width) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tổng chi theo tháng</CardTitle>
              <p className="text-sm text-gray-600">Chi tiết chi tiêu từ quỹ theo từng tháng năm {selectedYear}</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tháng</TableHead>
                    <TableHead className="text-right">Tái đầu tư</TableHead>
                    <TableHead className="text-right">Khấu hao</TableHead>
                    <TableHead className="text-right">Rủi ro</TableHead>
                    <TableHead className="text-right">Lương thưởng</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const monthData = expenditureSummary?.monthlyExpenditure?.[month] || {};
                    const monthTotal = Object.values(monthData).reduce((sum, val) => sum + val, 0);
                    
                    return (
                      <TableRow key={month}>
                        <TableCell className="font-medium">Tháng {month}</TableCell>
                        <TableCell className="text-right">
                          {monthData.reinvestment ? formatCurrency(monthData.reinvestment) : "0"}
                        </TableCell>
                        <TableCell className="text-right">
                          {monthData.depreciation ? formatCurrency(monthData.depreciation) : "0"}
                        </TableCell>
                        <TableCell className="text-right">
                          {monthData.risk_reserve ? formatCurrency(monthData.risk_reserve) : "0"}
                        </TableCell>
                        <TableCell className="text-right">
                          {monthData.staff_bonus ? formatCurrency(monthData.staff_bonus) : "0"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {monthTotal > 0 ? formatCurrency(monthTotal) : "0"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Total Expenditure Summary (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng chi quỹ</CardTitle>
              <p className="text-sm text-gray-600">Tổng chi tiêu năm {selectedYear}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {expenditureSummary?.totalExpended ? formatCurrency(expenditureSummary.totalExpended) : "0"}
                  </div>
                  <p className="text-sm text-gray-600">Tổng chi trong năm</p>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(accountTypeLabels).map(([key, label]) => {
                    const amount = expenditureSummary?.byAccount?.[key] || 0;
                    const Icon = accountTypeIcons[key];
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{label}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenditure Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ chi tiêu</CardTitle>
              <p className="text-sm text-gray-600">Tỷ lệ chi tiêu theo loại quỹ</p>
            </CardHeader>
            <CardContent>
              <ExpenditurePieChart data={expenditureSummary?.byAccount || {}} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expenditure History Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>LỊCH SỬ TRÍCH QUỸ</CardTitle>
              <p className="text-sm text-gray-600">Danh sách các khoản chi từ quỹ dự trữ</p>
            </div>
            <div className="flex space-x-2">
              {selectedExpenditures.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleteMultipleExpendituresMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa ({selectedExpenditures.length})
                </Button>
              )}
              <Button 
                onClick={() => {
                  setSelectedExpenditure(null);
                  setIsExpenditureModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm khoản chi
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expenditures && expenditures.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedExpenditures.length === expenditures.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>STT</TableHead>
                  <TableHead>Mục chi</TableHead>
                  <TableHead>Nguồn chi</TableHead>
                  <TableHead className="text-right">Tiền chi</TableHead>
                  <TableHead>Ngày chi</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenditures.slice(0, 10).map((expenditure: ReserveExpenditure, index: number) => (
                  <TableRow key={expenditure.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedExpenditures.includes(expenditure.id)}
                        onCheckedChange={() => toggleSelectExpenditure(expenditure.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{expenditure.name}</TableCell>
                    <TableCell>
                      <Badge className={accountTypeColors[expenditure.sourceType] || "bg-gray-100 text-gray-800"}>
                        {accountTypeLabels[expenditure.sourceType] || expenditure.sourceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expenditure.amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(expenditure.expenditureDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {expenditure.notes || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpenditure(expenditure)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpenditure(expenditure.id)}
                          disabled={deleteExpenditureMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Chưa có khoản chi nào từ quỹ dự trữ</p>
              <Button 
                onClick={() => {
                  setSelectedExpenditure(null);
                  setIsExpenditureModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm khoản chi đầu tiên
              </Button>
            </div>
          )}
          
          {/* Pagination would go here if needed */}
          {expenditures && expenditures.length > 10 && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-gray-500">
                Hiển thị 10 trong tổng số {expenditures.length} khoản chi
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ReserveAllocationModal
        open={isAllocationModalOpen}
        onOpenChange={setIsAllocationModalOpen}
      />
      
      <ReserveExpenditureModal
        open={isExpenditureModalOpen}
        onOpenChange={(open) => {
          setIsExpenditureModalOpen(open);
          if (!open) {
            setSelectedExpenditure(null);
          }
        }}
        expenditure={selectedExpenditure}
      />

      {/* Delete Confirmation Modals */}
      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa khoản chi"
        description="Bạn có chắc chắn muốn xóa khoản chi này không? Hành động này không thể hoàn tác."
        isLoading={deleteExpenditureMutation.isPending}
      />

      <ConfirmDeleteModal
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        onConfirm={handleConfirmBulkDelete}
        title="Xác nhận xóa nhiều khoản chi"
        description={`Bạn có chắc chắn muốn xóa ${selectedExpenditures.length} khoản chi đã chọn không? Hành động này không thể hoàn tác.`}
        isLoading={deleteMultipleExpendituresMutation.isPending}
      />
    </div>
  );
}
