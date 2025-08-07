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

// Dynamic account data will be loaded from settings
const getAccountTypeColor = (index: number) => {
  const colors = [
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800", 
    "bg-red-100 text-red-800",
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
  ];
  return colors[index % colors.length];
};

const getAccountTypeIcon = (index: number) => {
  const icons = [TrendingUp, DollarSign, AlertTriangle, Users, Target, PieChart];
  return icons[index % icons.length];
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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

  // Function to get account data
  const getAccountByName = (accountName: string) => {
    return allocationAccounts.find(acc => acc.name === accountName);
  };

  const getAccountColor = (accountName: string) => {
    const index = allocationAccounts.findIndex(acc => acc.name === accountName);
    return index >= 0 ? getAccountTypeColor(index) : "bg-gray-100 text-gray-800";
  };

  // Filter accounts - exclude "Cổ tức" and "Marketing" 
  const filteredAllocationAccounts = allocationAccounts.filter(acc => 
    acc.name !== "Cổ tức" && acc.name !== "Marketing"
  );

  // Sort expenditures by date (newest first) and paginate
  const sortedExpenditures = expenditures?.sort((a, b) => 
    new Date(b.expenditureDate).getTime() - new Date(a.expenditureDate).getTime()
  ) || [];
  
  const totalPages = Math.ceil(sortedExpenditures.length / itemsPerPage);
  const paginatedExpenditures = sortedExpenditures.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

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

      {/* Dynamic Summary Cards based on filtered allocation accounts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {filteredAllocationAccounts.slice(0, 4).map((account, index) => {
          const colorStyles = [
            { border: 'border-green-200', bg: 'bg-gradient-to-br from-green-50 to-green-100', text: 'text-green-900', icon: 'text-green-600' },
            { border: 'border-yellow-200', bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', text: 'text-yellow-900', icon: 'text-yellow-600' },
            { border: 'border-red-200', bg: 'bg-gradient-to-br from-red-50 to-red-100', text: 'text-red-900', icon: 'text-red-600' },
            { border: 'border-blue-200', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', text: 'text-blue-900', icon: 'text-blue-600' }
          ];
          const style = colorStyles[index % colorStyles.length];
          const IconComponent = getAccountTypeIcon(index);
          const amount = expenditureSummary?.byAccount?.[account.name] || 0;
          
          return (
            <Card key={account.id} className={`${style.border} ${style.bg}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${style.text}`}>{account.name}</CardTitle>
                <IconComponent className={`h-4 w-4 ${style.icon}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${style.text}`}>
                  {amount ? formatCurrency(amount) : "0"}
                </div>
                <p className={`text-xs ${style.icon}`}>
                  Đã chi năm {selectedYear}
                </p>
              </CardContent>
            </Card>
          );
        })}

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
                    {filteredAllocationAccounts.slice(0, 4).map((account) => (
                      <TableHead key={account.id} className="text-right">{account.name}</TableHead>
                    ))}
                    <TableHead className="text-right">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const monthData = expenditureSummary?.monthlyExpenditure?.[month] || {};
                    // Only calculate total for filtered accounts (exclude "Cổ tức" and "Marketing")
                    const monthTotal = filteredAllocationAccounts.reduce((sum, account) => 
                      sum + (monthData[account.name] || 0), 0);
                    
                    return (
                      <TableRow key={month}>
                        <TableCell className="font-medium">Tháng {month}</TableCell>
                        {filteredAllocationAccounts.slice(0, 4).map((account) => (
                          <TableCell key={account.id} className="text-right">
                            {monthData[account.name] ? formatCurrency(monthData[account.name]) : "0"}
                          </TableCell>
                        ))}
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
                    {(() => {
                      const filteredTotal = filteredAllocationAccounts.reduce((sum, account) => 
                        sum + (expenditureSummary?.byAccount?.[account.name] || 0), 0);
                      return filteredTotal > 0 ? formatCurrency(filteredTotal) : "0";
                    })()}
                  </div>
                  <p className="text-sm text-gray-600">Tổng chi trong năm</p>
                </div>
                
                <div className="space-y-3">
                  {filteredAllocationAccounts.map((account, index) => {
                    const amount = expenditureSummary?.byAccount?.[account.name] || 0;
                    const Icon = getAccountTypeIcon(index);
                    
                    return (
                      <div key={account.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{account.name}</span>
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
                {paginatedExpenditures.map((expenditure: ReserveExpenditure, index: number) => (
                  <TableRow key={expenditure.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedExpenditures.includes(expenditure.id)}
                        onCheckedChange={() => toggleSelectExpenditure(expenditure.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell>{expenditure.name}</TableCell>
                    <TableCell>
                      <Badge className={getAccountColor(expenditure.sourceType)}>
                        {expenditure.sourceType}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-700">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedExpenditures.length)} của {sortedExpenditures.length} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
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
