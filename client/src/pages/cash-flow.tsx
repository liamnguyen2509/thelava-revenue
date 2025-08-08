import React, { useState } from "react";
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
import { ExpenseModal } from "@/components/modals/expense-modal";
import { Calendar, Plus, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SystemSetting, ExpenseCategory, AllocationAccount } from "@shared/schema";

export default function CashFlow() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<{ month: number; amount: number } | null>(null);
  const [expandedRevenueRows, setExpandedRevenueRows] = useState<Set<number>>(new Set());
  const [expandedAllocationRows, setExpandedAllocationRows] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: revenues, isLoading } = useQuery({
    queryKey: [`/api/revenues/${selectedYear}`],
  });

  const { data: expenses } = useQuery({
    queryKey: [`/api/expenses/${selectedYear}`],
  });


  // Fetch system settings for currency
  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  // Fetch expense categories from settings
  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/settings/expense-categories"],
  });

  // Fetch allocation accounts for profit distribution
  const { data: allocationAccounts = [] } = useQuery<AllocationAccount[]>({
    queryKey: ["/api/settings/allocation-accounts"],
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  // Function to detect mobile devices
  const isMobile = () => {
    return window.innerWidth < 768; // md breakpoint in Tailwind
  };

  // Function to convert numbers to Vietnamese abbreviated format
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

  const formatCurrency = (amount: number) => {
    if (isMobile()) {
      // Mobile format: abbreviated Vietnamese numbers without currency
      return formatNumberToVietnamese(amount);
    } else {
      // Desktop format: full numbers with currency
      const currencySetting = systemSettings.find(s => s.key === "currency");
      const currency = currencySetting?.value || "VNĐ";
      return Math.round(amount).toLocaleString('vi-VN').replace(/,/g, '.') + " " + currency;
    }
  };

  // Helper function to get percentage for allocation account
  const getAccountPercentage = (accountName: string) => {
    const account = allocationAccounts.find(acc => acc.name === accountName);
    return Number(account?.percentage || 0);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const calculateExpensesByCategory = (monthIndex: number, category: string) => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    return expenses
      .filter((expense: any) => expense.month === monthIndex + 1 && expense.category === category)
      .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0);
  };

  const calculateTotalExpenses = (monthIndex: number) => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    return expenses
      .filter((expense: any) => expense.month === monthIndex + 1)
      .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0);
  };

  // Mutation for updating revenue
  const updateRevenueMutation = useMutation({
    mutationFn: async (data: { month: number; year: number; amount: string }) => {
      const res = await apiRequest("/api/revenues", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both specific year query and generic revenues query
      queryClient.invalidateQueries({ queryKey: [`/api/revenues/${selectedYear}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/revenues"] });
      toast({
        title: "Thành công",
        description: "Doanh thu đã được cập nhật",
      });
      setEditingRevenue(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật doanh thu",
        variant: "destructive",
      });
    },
  });

  const handleRowClick = (monthIndex: number) => {
    setLocation(`/monthly-expenses?month=${monthIndex + 1}&year=${selectedYear}`);
  };

  const handleRevenueEdit = (month: number, currentAmount: number) => {
    setEditingRevenue({ month, amount: Math.round(currentAmount) });
  };

  // Function to format number with dots for display in input
  const formatNumberForInput = (amount: number) => {
    return Math.round(amount).toLocaleString('vi-VN').replace(/,/g, '.');
  };

  // Function to parse number from input (remove dots)
  const parseNumberFromInput = (value: string) => {
    return parseFloat(value.replace(/\./g, '')) || 0;
  };

  const handleRevenueUpdate = (month: number, newAmount: number) => {
    // Convert amount to string to match decimal schema expectations
    updateRevenueMutation.mutate({
      month: month,
      year: selectedYear,
      amount: newAmount.toString(),
    });
  };

  const toggleRevenueRowExpansion = (monthIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRevenueRows);
    if (newExpanded.has(monthIndex)) {
      newExpanded.delete(monthIndex);
    } else {
      newExpanded.add(monthIndex);
    }
    setExpandedRevenueRows(newExpanded);
  };

  const toggleAllocationRowExpansion = (monthIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedAllocationRows);
    if (newExpanded.has(monthIndex)) {
      newExpanded.delete(monthIndex);
    } else {
      newExpanded.add(monthIndex);
    }
    setExpandedAllocationRows(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý dòng tiền</h1>
        <p className="text-gray-600 text-sm sm:text-base">Theo dõi và quản lý dòng tiền theo năm</p>
      </div>

      {/* Mobile Layout: Filters and Add Button */}
      <div className="md:hidden space-y-4 mb-6">
        {/* Year Filter */}
        <div>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger>
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
        
        {/* Add Button */}
        <Button onClick={() => setIsExpenseModalOpen(true)} className="bg-tea-brown hover:bg-tea-brown/90 w-full">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khoản chi
        </Button>
      </div>

      {/* Desktop Layout: Same as before */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="year" className="text-sm">Năm:</Label>
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
        </div>
        <Button onClick={() => setIsExpenseModalOpen(true)} className="bg-tea-brown hover:bg-tea-brown/90">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khoản chi
        </Button>
      </div>

      {/* Revenue by Year Table */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo năm {selectedYear}</CardTitle>
          <p className="text-sm text-gray-600">Bảng tổng quan doanh thu và chi phí theo tháng</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {/* Mobile: Show expand button */}
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 md:hidden">Chi tiết</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2">Tháng</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2">Doanh thu</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">DT TB Ngày</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">Lương NV</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden lg:table-cell">Tỷ lệ Lương</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">Nguyên liệu</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden lg:table-cell">Tỷ lệ NPL</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">Chi phí cố định</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden lg:table-cell">Tỷ lệ CP Cố định</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">CP Phát sinh</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden lg:table-cell">Tỷ lệ CP Phát Sinh</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2">Lợi nhuận ròng</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">Tỉ suất LN</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => {
                  const monthRevenue = revenues && Array.isArray(revenues) ? revenues.find((r: any) => r.month === index + 1)?.amount || 0 : 0;
                  const staffSalary = calculateExpensesByCategory(index, "staff_salary");
                  const ingredients = calculateExpensesByCategory(index, "ingredients");
                  const fixedExpenses = calculateExpensesByCategory(index, "fixed");
                  const additionalExpenses = calculateExpensesByCategory(index, "additional");
                  const totalExpenses = staffSalary + ingredients + fixedExpenses + additionalExpenses;
                  const netProfit = monthRevenue - totalExpenses;
                  const profitRatio = monthRevenue > 0 ? ((netProfit / monthRevenue) * 100).toFixed(1) : "0";
                  
                  // Calculate new ratios
                  const salaryRatio = monthRevenue > 0 ? ((staffSalary / monthRevenue) * 100).toFixed(1) : "0";
                  const ingredientsRatio = monthRevenue > 0 ? ((ingredients / monthRevenue) * 100).toFixed(1) : "0";
                  const fixedRatio = monthRevenue > 0 ? ((fixedExpenses / monthRevenue) * 100).toFixed(1) : "0";
                  const additionalRatio = monthRevenue > 0 ? ((additionalExpenses / monthRevenue) * 100).toFixed(1) : "0";
                  
                  // Calculate daily average revenue
                  const daysInMonth = getDaysInMonth(index + 1, selectedYear);
                  const dailyAverage = monthRevenue > 0 ? monthRevenue / daysInMonth : 0;

                  const isExpanded = expandedRevenueRows.has(index);
                  
                  return (
                    <React.Fragment key={index}>
                      <tr 
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(index)}
                      >
                        {/* Mobile expand button */}
                        <td className="py-4 text-sm md:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => toggleRevenueRowExpansion(index, e)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                        </td>
                        <td className="py-4 text-sm font-medium text-gray-900">{month}</td>
                        <td className="py-4 text-sm text-gray-900 text-right font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {editingRevenue?.month === index + 1 ? (
                              <Input
                                type="text"
                                value={formatNumberForInput(editingRevenue.amount)}
                                onChange={(e) => {
                                  const numericValue = parseNumberFromInput(e.target.value);
                                  setEditingRevenue({
                                    ...editingRevenue,
                                    amount: numericValue
                                  });
                                }}
                                onBlur={() => handleRevenueUpdate(index + 1, editingRevenue.amount)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRevenueUpdate(index + 1, editingRevenue.amount);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingRevenue(null);
                                  }
                                }}
                                className="w-32 text-right"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <>
                                <span>{formatCurrency(monthRevenue)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevenueEdit(index + 1, monthRevenue);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right text-blue-600 hidden md:table-cell">
                          {formatCurrency(dailyAverage)}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(staffSalary)}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                          {salaryRatio}%
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(ingredients)}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                          {ingredientsRatio}%
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(fixedExpenses)}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                          {fixedRatio}%
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(additionalExpenses)}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                          {additionalRatio}%
                        </td>
                        <td className={`py-4 text-sm text-right font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netProfit)}
                        </td>
                        <td className={`py-4 text-sm text-right hidden md:table-cell ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitRatio}%
                        </td>
                      </tr>
                      {/* Mobile expanded details */}
                      {isExpanded && (
                        <tr className="md:hidden bg-gray-50">
                          <td colSpan={3} className="px-4 py-3">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">DT TB Ngày:</span>
                                <span className="text-blue-600">{formatCurrency(dailyAverage)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Lương NV:</span>
                                <span>{formatCurrency(staffSalary)} ({salaryRatio}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Nguyên liệu:</span>
                                <span>{formatCurrency(ingredients)} ({ingredientsRatio}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Chi phí cố định:</span>
                                <span>{formatCurrency(fixedExpenses)} ({fixedRatio}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">CP Phát sinh:</span>
                                <span>{formatCurrency(additionalExpenses)} ({additionalRatio}%)</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="font-medium text-gray-600">Tỉ suất LN:</span>
                                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{profitRatio}%</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ lợi nhuận ròng</CardTitle>
          <p className="text-sm text-gray-600">Phân bổ lợi nhuận vào các tài khoản dự trữ</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {/* Mobile: Show expand button */}
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 md:hidden">Chi tiết</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2">Tháng</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">
                    Tái đầu tư ({getAccountPercentage("Tái đầu tư")}%)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">
                    Khấu hao ({getAccountPercentage("Khấu hao")}%)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">
                    Dự phòng RR ({getAccountPercentage("Dự phòng rủi ro")}%)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">
                    Thưởng NV ({getAccountPercentage("Thưởng nhân viên")}%)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">
                    Cổ tức ({getAccountPercentage("Cổ tức")}%)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 hidden md:table-cell">
                    Marketing ({getAccountPercentage("Marketing")}%)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2">
                    TỔNG
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => {
                  const monthRevenue = revenues && Array.isArray(revenues) ? revenues.find((r: any) => r.month === index + 1)?.amount || 0 : 0;
                  const totalExpenses = calculateTotalExpenses(index);
                  const netProfit = monthRevenue - totalExpenses;

                  // Calculate allocations based on real settings
                  const getAccountAllocation = (accountName: string) => {
                    const account = allocationAccounts.find(acc => acc.name === accountName);
                    const percentage = Number(account?.percentage || 0);
                    return (netProfit * percentage) / 100;
                  };

                  const reinvestment = getAccountAllocation("Tái đầu tư");
                  const depreciation = getAccountAllocation("Khấu hao");
                  const riskReserve = getAccountAllocation("Dự phòng rủi ro");
                  const staffBonus = getAccountAllocation("Thưởng nhân viên");
                  const dividends = getAccountAllocation("Cổ tức");
                  const marketing = getAccountAllocation("Marketing");

                  // Calculate total allocation for the month
                  const totalAllocation = Math.max(0, reinvestment) + 
                                        Math.max(0, depreciation) + 
                                        Math.max(0, riskReserve) + 
                                        Math.max(0, staffBonus) + 
                                        Math.max(0, dividends) + 
                                        Math.max(0, marketing);

                  const isAllocationExpanded = expandedAllocationRows.has(index);
                  
                  return (
                    <React.Fragment key={index}>
                      <tr className="border-b border-gray-50">
                        {/* Mobile expand button */}
                        <td className="py-4 text-sm md:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => toggleAllocationRowExpansion(index, e)}
                            className="h-8 w-8 p-0"
                          >
                            {isAllocationExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                        </td>
                        <td className="py-4 text-sm font-medium text-gray-900">{month}</td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(Math.max(0, reinvestment))}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(Math.max(0, depreciation))}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(Math.max(0, riskReserve))}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(Math.max(0, staffBonus))}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(Math.max(0, dividends))}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right hidden md:table-cell">
                          {formatCurrency(Math.max(0, marketing))}
                        </td>
                        <td className="py-4 text-sm font-bold text-tea-brown text-right">
                          {formatCurrency(totalAllocation)}
                        </td>
                      </tr>
                      {/* Mobile expanded details */}
                      {isAllocationExpanded && (
                        <tr className="md:hidden bg-gray-50">
                          <td colSpan={3} className="px-4 py-3">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Tái đầu tư ({getAccountPercentage("Tái đầu tư")}%):</span>
                                <span>{formatCurrency(Math.max(0, reinvestment))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Khấu hao ({getAccountPercentage("Khấu hao")}%):</span>
                                <span>{formatCurrency(Math.max(0, depreciation))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Dự phòng RR ({getAccountPercentage("Dự phòng rủi ro")}%):</span>
                                <span>{formatCurrency(Math.max(0, riskReserve))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Thưởng NV ({getAccountPercentage("Thưởng nhân viên")}%):</span>
                                <span>{formatCurrency(Math.max(0, staffBonus))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Cổ tức ({getAccountPercentage("Cổ tức")}%):</span>
                                <span>{formatCurrency(Math.max(0, dividends))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Marketing ({getAccountPercentage("Marketing")}%):</span>
                                <span>{formatCurrency(Math.max(0, marketing))}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
}
