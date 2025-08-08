import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Calendar, DollarSign, ChevronLeft, ChevronRight, CalendarIcon, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { SystemSetting, ExpenseCategory, Expense } from "@shared/schema";

interface ExpenseFormData {
  name: string;
  category: string;
  amount: string;
  expenseDate: string;
  status: string;
  notes: string;
}

export default function MonthlyExpenses() {
  const currentDate = new Date();
  const [location] = useLocation();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const monthFromUrl = urlParams.get('month');
  const yearFromUrl = urlParams.get('year');
  
  const [selectedYear, setSelectedYear] = useState(yearFromUrl ? parseInt(yearFromUrl) : currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(monthFromUrl ? parseInt(monthFromUrl) : currentDate.getMonth() + 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: "",
    category: "",
    amount: "0",
    expenseDate: new Date().toISOString().split('T')[0],
    status: "spent",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: [`/api/expenses/${selectedYear}/${selectedMonth}`],
  });



  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/settings/expense-categories"],
  });

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const months = [
    { value: 1, label: "1" }, { value: 2, label: "2" },
    { value: 3, label: "3" }, { value: 4, label: "4" },
    { value: 5, label: "5" }, { value: 6, label: "6" },
    { value: 7, label: "7" }, { value: 8, label: "8" },
    { value: 9, label: "9" }, { value: 10, label: "10" },
    { value: 11, label: "11" }, { value: 12, label: "12" }
  ];

  const getCurrency = () => {
    const currencySetting = systemSettings.find(s => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  // Vietnamese number formatting for mobile
  const formatNumberToVietnamese = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      const millions = amount / 1000000;
      return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} triệu`;
    } else if (absAmount >= 1000) {
      const thousands = amount / 1000;
      return `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)} nghìn`;
    } else {
      return Math.round(amount).toString();
    }
  };

  const formatMobileAmount = (amount: number) => {
    return formatNumberToVietnamese(amount);
  };

  const toggleRowExpansion = (expenseId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
    }
    setExpandedRows(newExpanded);
  };

  // Reset current page when year/month changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedExpenses([]);
  }, [selectedYear, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return Math.round(amount).toLocaleString('vi-VN').replace(/,/g, '.') + " " + getCurrency();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };



  // Calculate summary data - Không cần filter vì API đã filter theo year/month
  const calculateSummary = () => {
    const expensesData = Array.isArray(expenses) ? expenses : [];
    

    


    const salaryTotal = expensesData
      .filter((e: Expense) => e.category === "staff_salary")
      .reduce((sum: number, e: Expense) => sum + parseFloat(e.amount), 0);

    const materialsTotal = expensesData
      .filter((e: Expense) => e.category === "ingredients")
      .reduce((sum: number, e: Expense) => sum + parseFloat(e.amount), 0);

    const fixedTotal = expensesData
      .filter((e: Expense) => e.category === "fixed")
      .reduce((sum: number, e: Expense) => sum + parseFloat(e.amount), 0);

    const variableTotal = expensesData
      .filter((e: Expense) => e.category === "additional")
      .reduce((sum: number, e: Expense) => sum + parseFloat(e.amount), 0);

    const totalExpenses = salaryTotal + materialsTotal + fixedTotal + variableTotal;

    return {
      salaryTotal,
      materialsTotal,
      fixedTotal,
      variableTotal,
      totalExpenses
    };
  };

  const summary = calculateSummary();
  
  // Dữ liệu expenses đã được filter từ API, sort by date descending (mới nhất trước)
  const sortedExpenses = Array.isArray(expenses) ? 
    [...expenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()) : [];
  
  // Pagination
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredExpenses = sortedExpenses.slice(startIndex, endIndex);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const expenseDate = new Date(data.expenseDate);
      const processedData = {
        ...data,
        year: expenseDate.getFullYear(),
        month: expenseDate.getMonth() + 1,
      };
      const res = await apiRequest("/api/expenses", "POST", processedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${selectedYear}/${selectedMonth}`] });
      toast({ title: "Thành công", description: "Chi phí đã được thêm thành công" });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi thêm chi phí",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseFormData & { id: string }) => {
      const expenseDate = new Date(data.expenseDate);
      const processedData = {
        ...data,
        year: expenseDate.getFullYear(),
        month: expenseDate.getMonth() + 1,
      };
      const res = await apiRequest(`/api/expenses/${data.id}`, "PUT", processedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${selectedYear}/${selectedMonth}`] });
      toast({ title: "Thành công", description: "Chi phí đã được cập nhật thành công" });
      setIsModalOpen(false);
      setEditingExpense(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật chi phí",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/expenses/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${selectedYear}/${selectedMonth}`] });
      toast({ title: "Thành công", description: "Chi phí đã được xóa thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa chi phí",
        variant: "destructive",
      });
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest(`/api/expenses/${id}`, "DELETE")));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${selectedYear}/${selectedMonth}`] });
      toast({ title: "Thành công", description: "Các chi phí đã được xóa thành công" });
      setSelectedExpenses([]);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa chi phí",
        variant: "destructive",
      });
    },
  });

  const formatAmountForDisplay = (amount: string): string => {
    const numericValue = amount.replace(/\D/g, '');
    if (!numericValue || numericValue === '0') return '';
    return parseInt(numericValue).toLocaleString('vi-VN').replace(/,/g, '.');
  };

  const parseAmountFromDisplay = (displayAmount: string): string => {
    const numericValue = displayAmount.replace(/\D/g, '');
    return numericValue || '0';
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and dots
    const cleaned = value.replace(/[^0-9.]/g, '');
    const rawValue = parseAmountFromDisplay(cleaned);
    setFormData(prev => ({ ...prev, amount: rawValue }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      amount: "0",
      expenseDate: new Date().toISOString().split('T')[0],
      status: "spent",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (editingExpense) {
      updateMutation.mutate({ ...formData, id: editingExpense.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    
    // Format date from yyyy-mm-dd to input format
    const formattedDate = expense.expenseDate;
    
    // Format amount - remove decimal .00 if present and convert to string
    const formattedAmount = parseFloat(expense.amount).toString();
    
    setFormData({
      name: expense.name,
      category: expense.category,
      amount: formattedAmount,
      expenseDate: formattedDate,
      status: expense.status,
      notes: expense.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteMutation.mutate(expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedExpenses.length === 0) return;
    setDeleteMultipleDialogOpen(true);
  };

  const confirmDeleteMultiple = () => {
    deleteMultipleMutation.mutate(selectedExpenses);
    setDeleteMultipleDialogOpen(false);
  };

  const toggleSelectExpense = (id: string) => {
    setSelectedExpenses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map((e: Expense) => e.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chi phí hàng tháng</h1>
        <p className="text-gray-600 text-sm sm:text-base">Quản lý chi phí hàng tháng của tiệm</p>
      </div>

      {/* Mobile Layout: Filters and Add Button */}
      <div className="md:hidden space-y-4 mb-6">
        {/* Filters Row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Add Button */}
        <Button
          onClick={() => {
            setEditingExpense(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-tea-brown hover:bg-tea-brown/90 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm khoản chi
        </Button>
      </div>

      {/* Desktop Layout: Same as before */}
      <div className="hidden md:flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-tea-brown" />
          <Label htmlFor="year-select">Năm:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="month-select">Tháng:</Label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Lương NV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(summary.salaryTotal)}</div>
            <p className="text-xs text-blue-600 mt-1">Tổng chi lương nhân viên</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Nguyên Phụ Liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(summary.materialsTotal)}</div>
            <p className="text-xs text-green-600 mt-1">Tổng chi mua NPL</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">CP Cố định</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(summary.fixedTotal)}</div>
            <p className="text-xs text-purple-600 mt-1">Chi phí cố định</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">CP Phát sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(summary.variableTotal)}</div>
            <p className="text-xs text-orange-600 mt-1">Chi phí phát sinh</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Tổng chi tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</div>
            <p className="text-xs text-red-600 mt-1">Tổng tất cả các khoản chi</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách chi tiêu</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Hiển thị chi tiêu tháng {selectedMonth}/{selectedYear}
          </p>
          {/* Desktop Add Button */}
          <div className="hidden md:flex gap-2 mt-4">
            {selectedExpenses.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMultiple}
                disabled={deleteMultipleMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa ({selectedExpenses.length})
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingExpense(null);
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-tea-brown hover:bg-tea-brown/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm khoản chi
            </Button>
          </div>
          {/* Mobile Bulk Delete Button */}
          {selectedExpenses.length > 0 && (
            <div className="md:hidden mt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMultiple}
                disabled={deleteMultipleMutation.isPending}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa ({selectedExpenses.length}) mục đã chọn
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mobile-table-container">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 sticky left-0 bg-white z-10 w-12">
                    <Checkbox
                      checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-center py-3 px-2 w-8 md:hidden"></th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">STT</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Khoản Chi</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Loại chi</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Số tiền</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Ngày chi</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Ghi chú</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      Chưa có chi phí nào trong tháng này
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense: Expense, index: number) => {
                    const isExpanded = expandedRows.has(expense.id);
                    
                    return (
                      <React.Fragment key={expense.id}>
                        <tr className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-4 px-2 sm:px-4 sticky left-0 bg-white">
                            <Checkbox
                              checked={selectedExpenses.includes(expense.id)}
                              onCheckedChange={() => toggleSelectExpense(expense.id)}
                            />
                          </td>
                          
                          {/* Mobile Expand Button */}
                          <td className="py-4 px-2 text-center md:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(expense.id)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          
                          {/* STT - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-900 hidden md:table-cell">{index + 1}</td>
                          
                          {/* Expense Name */}
                          <td className="py-4 px-2 sm:px-4 text-sm font-medium text-gray-900">
                            <div className="truncate max-w-[120px] sm:max-w-none" title={expense.name}>
                              {expense.name}
                            </div>
                          </td>
                          
                          {/* Category - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-600 hidden md:table-cell">
                            {expense.category === 'staff_salary' ? 'Lương nhân viên' : 
                             expense.category === 'ingredients' ? 'Nguyên liệu' :
                             expense.category === 'fixed' ? 'Chi phí cố định' :
                             expense.category === 'additional' ? 'Chi phí phát sinh' : 
                             expense.category}
                          </td>
                          
                          {/* Amount */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-900 text-right font-medium">
                            <div className="truncate">
                              <span className="md:hidden">{formatMobileAmount(parseFloat(expense.amount))}</span>
                              <span className="hidden md:inline">{formatCurrency(parseFloat(expense.amount))}</span>
                            </div>
                          </td>
                          
                          {/* Date - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-600 text-center hidden md:table-cell">
                            {formatDate(expense.expenseDate)}
                          </td>
                          
                          {/* Notes - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-600 max-w-xs truncate hidden md:table-cell">
                            {expense.notes || "-"}
                          </td>
                          
                          {/* Actions - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-center hidden md:table-cell">
                            <div className="flex justify-center gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(expense)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(expense.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable Row Details for Mobile */}
                        {isExpanded && (
                          <tr className="md:hidden border-b border-gray-50 bg-gray-50">
                            <td colSpan={4} className="px-4 py-3">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">STT:</span>
                                  <span className="font-medium">{index + 1}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Loại chi:</span>
                                  <span className="font-medium">
                                    {expense.category === 'staff_salary' ? 'Lương nhân viên' : 
                                     expense.category === 'ingredients' ? 'Nguyên liệu' :
                                     expense.category === 'fixed' ? 'Chi phí cố định' :
                                     expense.category === 'additional' ? 'Chi phí phát sinh' : 
                                     expense.category}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ngày chi:</span>
                                  <span className="font-medium">{formatDate(expense.expenseDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ghi chú:</span>
                                  <span className="font-medium">{expense.notes || "-"}</span>
                                </div>
                                <div className="flex gap-2 pt-2 justify-end border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(expense)}
                                    className="h-8"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(expense.id)}
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Xóa
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Expense Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Chỉnh sửa chi phí" : "Thêm khoản chi mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên khoản chi</Label>
              <Input
                id="name"
                placeholder="Nhập tên khoản chi"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Loại chi phí</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại chi phí" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.code}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền ({getCurrency()})</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={formatAmountForDisplay(formData.amount)}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ngày chi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !formData.expenseDate && "text-muted-foreground"
                    )}
                  >
                    {formData.expenseDate ? (
                      format(new Date(formData.expenseDate), "dd/MM/yyyy", { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.expenseDate ? new Date(formData.expenseDate + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Fix date selection issue by ensuring proper timezone handling
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        setFormData(prev => ({ ...prev, expenseDate: `${year}-${month}-${day}` }));
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spent">Đã chi</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Input
                id="notes"
                placeholder="Nhập ghi chú (tùy chọn)"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingExpense(null);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-tea-brown hover:bg-tea-brown/90"
              >
                {editingExpense ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          {/* Desktop: Show result count and pagination on same row */}
          <div className="hidden md:flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedExpenses.length)} trong {sortedExpenses.length} kết quả
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || 
                         (page >= currentPage - 1 && page <= currentPage + 1);
                })
                .map((page, index, filteredPages) => {
                  const showLeftEllipsis = index === 1 && filteredPages[0] === 1 && filteredPages[1] > 2;
                  const showRightEllipsis = index === filteredPages.length - 2 && 
                    filteredPages[filteredPages.length - 1] === totalPages && 
                    filteredPages[filteredPages.length - 2] < totalPages - 1;
                  
                  return (
                    <div key={page} className="flex items-center">
                      {showLeftEllipsis && <span className="px-2">...</span>}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-tea-brown hover:bg-tea-brown/90" : ""}
                      >
                        {page}
                      </Button>
                      {showRightEllipsis && <span className="px-2">...</span>}
                    </div>
                  );
                })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Mobile: Center pagination buttons and result count below */}
          <div className="md:hidden space-y-3">
            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || 
                         (page >= currentPage - 1 && page <= currentPage + 1);
                })
                .map((page, index, filteredPages) => {
                  const showLeftEllipsis = index === 1 && filteredPages[0] === 1 && filteredPages[1] > 2;
                  const showRightEllipsis = index === filteredPages.length - 2 && 
                    filteredPages[filteredPages.length - 1] === totalPages && 
                    filteredPages[filteredPages.length - 2] < totalPages - 1;
                  
                  return (
                    <div key={page} className="flex items-center">
                      {showLeftEllipsis && <span className="px-2 text-xs">...</span>}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-tea-brown hover:bg-tea-brown/90" : ""}
                      >
                        {page}
                      </Button>
                      {showRightEllipsis && <span className="px-2 text-xs">...</span>}
                    </div>
                  );
                })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {/* Result Count Below */}
            <div className="text-center text-xs text-gray-500">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedExpenses.length)} trong {sortedExpenses.length} kết quả
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Item Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khoản chi phí này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Items Dialog */}
      <AlertDialog open={deleteMultipleDialogOpen} onOpenChange={setDeleteMultipleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhiều mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedExpenses.length} khoản chi phí đã chọn? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMultiple}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa {selectedExpenses.length} mục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}