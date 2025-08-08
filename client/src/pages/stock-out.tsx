import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormattedData } from "@/hooks/useFormattedData";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StockTransactionModal from "@/components/modals/stock-transaction-modal";
import { generateYearOptions, generateMonthOptions } from "@/lib/formatters";
import * as XLSX from 'xlsx';
import {
  Plus,
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Upload,
} from "lucide-react";
import type { StockItem, StockTransaction } from "@shared/schema";

export default function StockOut() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<StockTransaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const { formatMoney, formatDisplayDate } = useFormattedData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Generate filter options
  const yearOptions = generateYearOptions(new Date().getFullYear(), 10);
  const monthOptions = generateMonthOptions();

  const { data: stockItems, isLoading: itemsLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/items"],
  });

  const { data: stockTransactions, isLoading: transactionsLoading } = useQuery<StockTransaction[]>({
    queryKey: ["/api/stock/transactions"],
  });

  // Filter stock-out transactions only
  const stockOutTransactions = stockTransactions?.filter(t => t.type === 'out') || [];

  // Filter transactions based on search, year, and month
  const filteredTransactions = stockOutTransactions.filter(transaction => {
    const item = stockItems?.find(item => item.id === transaction.itemId);
    if (!item) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filtering
    const transactionDate = new Date(transaction.transactionDate);
    const transactionYear = transactionDate.getFullYear();
    const transactionMonth = transactionDate.getMonth() + 1;
    
    const matchesYear = selectedYear === "all" || transactionYear === parseInt(selectedYear);
    const matchesMonth = selectedMonth === "all" || transactionMonth === parseInt(selectedMonth);
    
    return matchesSearch && matchesYear && matchesMonth;
  });

  // Get low stock items for warnings
  const lowStockItems = stockItems?.filter(item => 
    parseFloat(item.currentStock) <= parseFloat(item.minStock)
  ) || [];

  // Mutation for deleting transaction
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/stock/transactions/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      setIsDeleteDialogOpen(false);
      setDeleteTransactionId(null);
      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa giao dịch",
        variant: "destructive",
      });
    },
  });

  // Mutation for bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest('/api/stock/transactions', 'DELETE', { ids });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      setSelectedTransactions([]);
      setIsBulkDeleteDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã xóa các giao dịch đã chọn",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa giao dịch",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (transaction: StockTransaction) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTransactionId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTransactionId) {
      deleteMutation.mutate(deleteTransactionId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.length > 0) {
      setIsBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedTransactions);
  };

  const toggleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(transaction => transaction.id));
    }
  };

  // Excel export functionality
  const handleExportToExcel = () => {
    if (!filteredTransactions.length) {
      toast({
        title: "Thông báo",
        description: "Không có dữ liệu để xuất",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for export
    const exportData = filteredTransactions.map(transaction => {
      const item = stockItems?.find(item => item.id === transaction.itemId);
      return {
        'Ngày xuất': formatDisplayDate(transaction.transactionDate),
        'Hàng hóa': item?.name || 'Không rõ',
        'Đơn vị': item?.unit || '-',
        'Số lượng': parseFloat(transaction.quantity),
        'Giá đơn vị': transaction.unitPrice ? parseFloat(transaction.unitPrice) : 0,
        'Tổng tiền': transaction.totalPrice ? parseFloat(transaction.totalPrice) : 0,
        'Ghi chú': transaction.notes || '-'
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Xuất kho');

    // Generate filename with current date
    const today = new Date();
    const filename = `xuat-kho-${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    toast({
      title: "Thành công",
      description: `Đã xuất ${filteredTransactions.length} giao dịch ra file Excel`,
    });
  };

  // Print functionality
  const handlePrint = () => {
    if (!filteredTransactions.length) {
      toast({
        title: "Thông báo",
        description: "Không có dữ liệu để in",
        variant: "destructive",
      });
      return;
    }

    // Create print content
    const printContent = `
      <html>
        <head>
          <title>Danh sách xuất kho</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #8B4513; margin-bottom: 30px; }
            .header-info { text-align: center; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .summary h3 { margin: 0 0 10px 0; color: #8B4513; }
            .warning { margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>DANH SÁCH XUẤT KHO</h1>
          <div class="header-info">
            <p><strong>Lava Tea Shop</strong></p>
            <p>Ngày in: ${formatDisplayDate(new Date().toISOString().split('T')[0])}</p>
            <p>Tổng số giao dịch: ${filteredTransactions.length}</p>
          </div>
          
          ${lowStockItems.length > 0 ? `
          <div class="warning">
            <h3>⚠️ Cảnh báo hàng tồn kho thấp</h3>
            <p>Các mặt hàng sau đang sắp hết hoặc đã hết: <strong>${lowStockItems.map(item => item.name).join(", ")}</strong></p>
          </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Ngày xuất</th>
                <th>Hàng hóa</th>
                <th>Đơn vị</th>
                <th class="text-right">Số lượng</th>
                <th class="text-right">Giá đơn vị</th>
                <th class="text-right">Tổng tiền</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(transaction => {
                const item = stockItems?.find(item => item.id === transaction.itemId);
                return `
                  <tr>
                    <td>${formatDisplayDate(transaction.transactionDate)}</td>
                    <td>${item?.name || 'Không rõ'}</td>
                    <td>${item?.unit || '-'}</td>
                    <td class="text-right">${parseFloat(transaction.quantity).toLocaleString('vi-VN')}</td>
                    <td class="text-right">${transaction.unitPrice ? formatMoney(parseFloat(transaction.unitPrice)) : '-'}</td>
                    <td class="text-right">${transaction.totalPrice ? formatMoney(parseFloat(transaction.totalPrice)) : '-'}</td>
                    <td>${transaction.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Tóm tắt</h3>
            <p><strong>Tổng số lượng:</strong> ${stockOutTransactions.reduce((total, t) => total + parseFloat(t.quantity), 0).toLocaleString('vi-VN')} sản phẩm</p>
            <p><strong>Tổng giá trị:</strong> ${formatMoney(
              stockOutTransactions.reduce((total, t) => total + (parseFloat(t.totalPrice || '0')), 0)
            )}</p>
            <p><strong>Hàng sắp hết:</strong> ${lowStockItems.length} mặt hàng</p>
          </div>
        </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const isLoading = itemsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xuất kho</h1>
          <p className="text-gray-600">Quản lý việc xuất hàng từ kho</p>
        </div>
        <div className="flex gap-2">
          {selectedTransactions.length > 0 && (
            <Button 
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa {selectedTransactions.length} mục
            </Button>
          )}
          <Button 
            onClick={() => {
              setEditingTransaction(null);
              setIsTransactionModalOpen(true);
            }}
            className="bg-tea-brown hover:bg-tea-brown/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Xuất hàng mới
          </Button>
        </div>
      </div>

      {/* Warning for low stock */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Cảnh báo: Có {lowStockItems.length} mặt hàng sắp hết hoặc đã hết hàng
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Kiểm tra kỹ trước khi xuất: {lowStockItems.map(item => item.name).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng lần xuất</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stockOutTransactions.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">giao dịch xuất kho</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Upload className="text-red-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số lượng xuất</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stockOutTransactions.reduce((total, t) => total + parseFloat(t.quantity), 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-gray-500 mt-1">sản phẩm đã xuất</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hàng sắp hết</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {lowStockItems.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">mặt hàng cần chú ý</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử xuất kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo tên hàng hóa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tháng</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                disabled={filteredTransactions.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
              
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={filteredTransactions.length === 0}
              >
                <Printer className="w-4 h-4 mr-2" />
                In dữ liệu
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Ngày xuất</TableHead>
                  <TableHead>Hàng hóa</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Giá đơn vị</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const item = stockItems?.find(item => item.id === transaction.itemId);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={() => toggleSelectTransaction(transaction.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDisplayDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item?.name || 'Không rõ'}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(transaction.quantity).toLocaleString('vi-VN')} {item?.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.unitPrice ? formatMoney(parseFloat(transaction.unitPrice)) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.totalPrice ? formatMoney(parseFloat(transaction.totalPrice)) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {transaction.notes || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Upload className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Chưa có giao dịch xuất kho nào</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setEditingTransaction(null);
                  setIsTransactionModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Xuất hàng đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Transaction Modal */}
      <StockTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={(open: boolean) => {
          setIsTransactionModalOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        transactionType="out"
        editingTransaction={editingTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa giao dịch này? Hành động này sẽ cập nhật lại tồn kho và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa {selectedTransactions.length} giao dịch đã chọn? Hành động này sẽ cập nhật lại tồn kho và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Đang xóa..." : "Xóa tất cả"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}