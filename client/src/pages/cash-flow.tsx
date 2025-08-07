import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Calendar, Plus } from "lucide-react";

export default function CashFlow() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const { data: revenues, isLoading } = useQuery({
    queryKey: ["/api/revenues", selectedYear],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses", selectedYear],
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateExpensesByCategory = (monthIndex: number, category: string) => {
    if (!expenses) return 0;
    return expenses
      .filter((expense: any) => expense.month === monthIndex + 1 && expense.category === category)
      .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0);
  };

  const calculateTotalExpenses = (monthIndex: number) => {
    if (!expenses) return 0;
    return expenses
      .filter((expense: any) => expense.month === monthIndex + 1)
      .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0);
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý dòng tiền</h1>
          <p className="text-gray-600">Theo dõi và quản lý dòng tiền theo năm</p>
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
          <Button onClick={() => setIsExpenseModalOpen(true)} className="bg-tea-brown hover:bg-tea-brown/90">
            <Plus className="w-4 h-4 mr-2" />
            Thêm chi phí
          </Button>
        </div>
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
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Tháng</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Doanh thu</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Lương NV</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Nguyên liệu</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Chi phí cố định</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Chi phí khác</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Lợi nhuận ròng</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Tỷ lệ LN</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => {
                  const monthRevenue = revenues?.find((r: any) => r.month === index + 1)?.amount || 0;
                  const staffSalary = calculateExpensesByCategory(index, "staff_salary");
                  const ingredients = calculateExpensesByCategory(index, "ingredients");
                  const fixedExpenses = calculateExpensesByCategory(index, "fixed");
                  const additionalExpenses = calculateExpensesByCategory(index, "additional");
                  const totalExpenses = staffSalary + ingredients + fixedExpenses + additionalExpenses;
                  const netProfit = monthRevenue - totalExpenses;
                  const profitRatio = monthRevenue > 0 ? ((netProfit / monthRevenue) * 100).toFixed(1) : "0";

                  return (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 text-sm font-medium text-gray-900">{month}</td>
                      <td className="py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(monthRevenue)}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(staffSalary)}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(ingredients)}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(fixedExpenses)}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(additionalExpenses)}
                      </td>
                      <td className={`py-4 text-sm text-right font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </td>
                      <td className={`py-4 text-sm text-right ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitRatio}%
                      </td>
                    </tr>
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
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Tháng</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Tái đầu tư</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Khấu hao</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Dự phòng RR</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Thưởng NV</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Cổ tức</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Marketing</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => {
                  const monthRevenue = revenues?.find((r: any) => r.month === index + 1)?.amount || 0;
                  const totalExpenses = calculateTotalExpenses(index);
                  const netProfit = monthRevenue - totalExpenses;

                  // Calculate allocations (these would come from settings in real app)
                  const reinvestment = netProfit * 0.25;
                  const depreciation = netProfit * 0.15;
                  const riskReserve = netProfit * 0.20;
                  const staffBonus = netProfit * 0.10;
                  const dividends = netProfit * 0.20;
                  const marketing = netProfit * 0.10;

                  return (
                    <tr key={index} className="border-b border-gray-50">
                      <td className="py-4 text-sm font-medium text-gray-900">{month}</td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(Math.max(0, reinvestment))}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(Math.max(0, depreciation))}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(Math.max(0, riskReserve))}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(Math.max(0, staffBonus))}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(Math.max(0, dividends))}
                      </td>
                      <td className="py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(Math.max(0, marketing))}
                      </td>
                    </tr>
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
