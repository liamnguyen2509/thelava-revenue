import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CashFlowChart from "@/components/charts/cash-flow-chart";
import RevenueChart from "@/components/charts/revenue-chart";
import { ExpenseModal } from "@/components/modals/expense-modal";
import RevenueModal from "@/components/modals/revenue-modal";
import { useState } from "react";
import { useFormattedData } from "@/hooks/useFormattedData";
import {
  TrendingUp,
  Calendar,
  CreditCard,
  Trophy,
  Plus,
  Coins,
  Package,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import type { ReserveExpenditure } from "@shared/schema";

interface ExpenditureSummaryData {
  totalExpended: number;
  byAccount: { [key: string]: number };
  monthlyExpenditure: { [month: number]: { [account: string]: number } };
}

export default function Dashboard() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const { formatMoney } = useFormattedData();
  const currentYear = new Date().getFullYear();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: revenueSummary } = useQuery({
    queryKey: ["/api/revenues/summary"],
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ["/api/expenses/summary"],
  });

  const { data: allocationAccounts } = useQuery({
    queryKey: ["/api/settings/allocation-accounts"],
  });

  // Get revenues and expenses for allocation calculation
  const { data: revenues } = useQuery({
    queryKey: [`/api/revenues/${currentYear}`],
  });

  const { data: expenses } = useQuery({
    queryKey: [`/api/expenses/${currentYear}`],
  });

  const { data: expenditureSummary } = useQuery<ExpenditureSummaryData>({
    queryKey: ["/api/reserve-expenditures/summary", currentYear],
    queryFn: () => fetch(`/api/reserve-expenditures/summary/${currentYear}`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Helper function to get percentage for allocation account
  const getAccountPercentage = (accountName: string) => {
    if (!allocationAccounts || !Array.isArray(allocationAccounts)) return 0;
    const account = allocationAccounts.find((acc: any) => acc.name === accountName);
    return Number(account?.percentage || 0);
  };

  // Calculate current monthly net profit for allocation calculations
  const currentMonthlyProfit = ((revenueSummary as any)?.monthly || 0) - ((expenseSummary as any)?.monthly || 0);

  // Helper function to format percentage change
  const formatPercentageChange = (percentage: number) => {
    const isPositive = percentage > 0;
    const isNegative = percentage < 0;
    const Icon = isNegative ? TrendingDown : TrendingUp;
    const colorClass = isNegative ? 'text-red-600' : 'text-green-600';
    const sign = isPositive ? '+' : '';
    
    return {
      text: `${sign}${percentage.toFixed(1)}%`,
      colorClass,
      Icon
    };
  };

  // Calculate profit growth (simplified calculation)
  const lastMonthProfit = currentMonthlyProfit * (1 - (((revenueSummary as any)?.monthlyGrowth || 0) - ((expenseSummary as any)?.monthlyGrowth || 0)) / 100);
  const profitGrowth = lastMonthProfit !== 0 ? ((currentMonthlyProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0;

  // Calculate allocation amount for each account
  const calculateAllocationAmount = (accountName: string) => {
    const percentage = getAccountPercentage(accountName);
    return (currentMonthlyProfit * percentage) / 100;
  };

  // Calculate total allocations for the year based on cash flow logic
  const calculateYearlyAllocations = () => {
    if (!revenues || !expenses || !allocationAccounts) {
      return {};
    }

    const yearlyAllocations: { [key: string]: number } = {};

    // Calculate for each month (1-12)
    for (let month = 1; month <= 12; month++) {
      // Get monthly revenue
      const monthRevenue = Array.isArray(revenues) 
        ? revenues.find((r: any) => r.month === month)?.amount || 0 
        : 0;

      // Calculate total monthly expenses
      const monthlyExpenses = Array.isArray(expenses)
        ? expenses.filter((e: any) => e.month === month)
            .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || '0'), 0)
        : 0;

      // Calculate net profit for the month
      const netProfit = parseFloat(monthRevenue.toString()) - monthlyExpenses;

      // Calculate allocations for each account
      if (Array.isArray(allocationAccounts)) {
        allocationAccounts.forEach((account: any) => {
          if (!yearlyAllocations[account.name]) {
            yearlyAllocations[account.name] = 0;
          }
          
          const percentage = Number(account.percentage || 0);
          const monthlyAllocation = (netProfit * percentage) / 100;
          yearlyAllocations[account.name] += Math.max(0, monthlyAllocation);
        });
      }
    }

    return yearlyAllocations;
  };

  const yearlyAllocations = calculateYearlyAllocations();

  // Get expenditure amount for each account
  const getExpenditureAmount = (accountName: string) => {
    return expenditureSummary?.byAccount?.[accountName] || 0;
  };

  // Calculate remaining amount for each account
  const getRemainingAmount = (accountName: string) => {
    const allocated = yearlyAllocations[accountName] || 0;
    const expended = getExpenditureAmount(accountName);
    return allocated - expended;
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tổng quan</h1>
        <p className="text-gray-600">Theo dõi doanh thu và hiệu suất kinh doanh của cửa hàng</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Annual Revenue Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu năm</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatMoney((revenueSummary as any)?.annual || 0)}
                </p>
                {(() => {
                  const change = formatPercentageChange((revenueSummary as any)?.annualGrowth || 0);
                  return (
                    <p className={`text-sm mt-1 ${change.colorClass}`}>
                      <change.Icon className="inline w-4 h-4 mr-1" />
                      {change.text} so với năm trước
                    </p>
                  );
                })()}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu tháng</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatMoney((revenueSummary as any)?.monthly || 0)}
                </p>
                {(() => {
                  const change = formatPercentageChange((revenueSummary as any)?.monthlyGrowth || 0);
                  return (
                    <p className={`text-sm mt-1 ${change.colorClass}`}>
                      <change.Icon className="inline w-4 h-4 mr-1" />
                      {change.text} so với tháng trước
                    </p>
                  );
                })()}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chi phí tháng</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatMoney((expenseSummary as any)?.monthly || 0)}
                </p>
                {(() => {
                  const change = formatPercentageChange((expenseSummary as any)?.monthlyGrowth || 0);
                  return (
                    <p className={`text-sm mt-1 ${change.colorClass}`}>
                      <change.Icon className="inline w-4 h-4 mr-1" />
                      {change.text} so với tháng trước
                    </p>
                  );
                })()}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Profit Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lợi nhuận ước tính</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatMoney(currentMonthlyProfit)}
                </p>
                {(() => {
                  const change = formatPercentageChange(profitGrowth);
                  return (
                    <p className={`text-sm mt-1 ${change.colorClass}`}>
                      <change.Icon className="inline w-4 h-4 mr-1" />
                      {change.text} so với tháng trước
                    </p>
                  );
                })()}
              </div>
              <div className="w-12 h-12 bg-tea-cream rounded-lg flex items-center justify-center">
                <Trophy className="text-tea-brown w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Reserve Accounts Table */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Phân bổ tài khoản dự trữ</CardTitle>
              <p className="text-sm text-gray-600">Theo dõi phân bổ lợi nhuận vào các quỹ</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Tài khoản</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Mô tả</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">%</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Tổng cộng</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Tổng chi</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {allocationAccounts && Array.isArray(allocationAccounts) && allocationAccounts.length > 0 ? (
                      allocationAccounts.map((account: any) => {
                        const totalAllocation = yearlyAllocations[account.name] || 0;
                        const totalExpenditure = getExpenditureAmount(account.name);
                        const remaining = getRemainingAmount(account.name);
                        
                        return (
                          <tr key={account.id} className="border-b border-gray-50">
                            <td className="py-3 text-sm font-medium text-gray-900">{account.name}</td>
                            <td className="py-3 text-sm text-gray-600">{account.description}</td>
                            <td className="py-3 text-sm text-gray-900 text-right">{account.percentage}%</td>
                            <td className="py-3 text-sm font-medium text-gray-900 text-right">
                              {formatMoney(totalAllocation)}
                            </td>
                            <td className="py-3 text-sm font-medium text-red-600 text-right">
                              {formatMoney(totalExpenditure)}
                            </td>
                            <td className={`py-3 text-sm font-medium text-right ${
                              remaining >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatMoney(remaining)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          Chưa có tài khoản phân bổ nào. Vui lòng cấu hình trong mục Cài đặt.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="text-green-600 w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">Thêm doanh thu tháng 12</p>
                    <p className="text-xs text-gray-500">2 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="text-blue-600 w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">Nhập kho trà xanh</p>
                    <p className="text-xs text-gray-500">5 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="text-orange-600 w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">Thêm chi phí nguyên liệu</p>
                    <p className="text-xs text-gray-500">1 ngày trước</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                  onClick={() => setIsExpenseModalOpen(true)}
                >
                  <Plus className="text-tea-brown w-6 h-6" />
                  <span className="text-sm font-medium">Thêm khoản chi</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                  onClick={() => setIsRevenueModalOpen(true)}
                >
                  <Coins className="text-tea-brown w-6 h-6" />
                  <span className="text-sm font-medium">Cập nhật doanh thu</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Package className="text-tea-brown w-6 h-6" />
                  <span className="text-sm font-medium">Nhập kho</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <TrendingDown className="text-tea-brown w-6 h-6" />
                  <span className="text-sm font-medium">Xuất kho</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFlowChart />
        <RevenueChart />
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      
      <RevenueModal
        open={isRevenueModalOpen}
        onOpenChange={setIsRevenueModalOpen}
      />
    </div>
  );
}
