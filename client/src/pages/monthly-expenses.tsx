import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
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
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
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
    queryKey: ["/api/expenses", { year: selectedYear, month: selectedMonth }],
  });

  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/settings/expense-categories"],
  });

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const months = [
    { value: 1, label: "Tháng 1" }, { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" }, { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" }, { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" }, { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" }, { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" }, { value: 12, label: "Tháng 12" }
  ];

  const getCurrency = () => {
    const currencySetting = systemSettings.find(s => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  const formatCurrency = (amount: number) => {
    return Math.round(amount).toLocaleString('vi-VN').replace(/,/g, '.') + " " + getCurrency();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Calculate summary data
  const calculateSummary = () => {
    const filteredExpenses = expenses.filter(expense => 
      expense.year === selectedYear && expense.month === selectedMonth
    );

    const salaryTotal = filteredExpenses
      .filter(e => e.category === "Lương nhân viên")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const materialsTotal = filteredExpenses
      .filter(e => e.category === "Nguyên phụ liệu")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const fixedTotal = filteredExpenses
      .filter(e => e.category === "Chi phí cố định")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const variableTotal = filteredExpenses
      .filter(e => e.category === "Chi phí phát sinh")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
    setFormData({
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      status: expense.status,
      notes: expense.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa chi phí này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedExpenses.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedExpenses.length} chi phí đã chọn?`)) {
      deleteMultipleMutation.mutate(selectedExpenses);
    }
  };

  const toggleSelectExpense = (id: string) => {
    setSelectedExpenses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredExpenses = expenses.filter(expense => 
      expense.year === selectedYear && expense.month === selectedMonth
    );
    
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(e => e.id));
    }
  };

  const filteredExpenses = expenses.filter(expense => 
    expense.year === selectedYear && expense.month === selectedMonth
  );

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-tea-brown">Chi phí hàng tháng</h1>
        <p className="text-tea-brown/70 mt-2">Quản lý chi phí hàng tháng của tiệm</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Danh sách chi tiêu</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Hiển thị chi tiêu tháng {selectedMonth}/{selectedYear}
              </p>
            </div>
            <div className="flex gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">
                    <Checkbox
                      checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">STT</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Khoản Chi</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Loại chi</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Số tiền</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Ngày chi</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Ghi chú</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Thao tác</th>
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
                  filteredExpenses.map((expense, index) => (
                    <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <Checkbox
                          checked={selectedExpenses.includes(expense.id)}
                          onCheckedChange={() => toggleSelectExpense(expense.id)}
                        />
                      </td>
                      <td className="py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="py-4 text-sm font-medium text-gray-900">{expense.name}</td>
                      <td className="py-4 text-sm text-gray-600">{expense.category}</td>
                      <td className="py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(parseFloat(expense.amount))}
                      </td>
                      <td className="py-4 text-sm text-gray-600 text-center">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td className="py-4 text-sm text-gray-600 max-w-xs truncate">
                        {expense.notes || "-"}
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex justify-center gap-2">
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
                  ))
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
                    <SelectItem key={category.id} value={category.name}>
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
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDate">Ngày chi</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
              />
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
    </div>
  );
}