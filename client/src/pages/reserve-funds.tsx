import React, { useState } from "react";
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
  DollarSign, Target, AlertTriangle, Users, ChevronDown, 
  ChevronRight as ChevronRightIcon 
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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null means "Tất cả"
  const [selectedExpenditure, setSelectedExpenditure] = useState<ReserveExpenditure | null>(null);
  const [selectedExpenditures, setSelectedExpenditures] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenditureToDelete, setExpenditureToDelete] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [expandedExpenditures, setExpandedExpenditures] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const toggleMonthExpansion = (month: number) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const toggleExpenditureExpansion = (expenditureId: string) => {
    const newExpanded = new Set(expandedExpenditures);
    if (newExpanded.has(expenditureId)) {
      newExpanded.delete(expenditureId);
    } else {
      newExpanded.add(expenditureId);
    }
    setExpandedExpenditures(newExpanded);
  };

  // Generate years array like in cash flow page
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  // Generate months array with "Tất cả" option
  const months = [
    { value: "all", label: "Tất cả" },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}`
    }))
  ];

  const { data: allocations } = useQuery<ReserveAllocation[]>({
    queryKey: ["/api/reserve-allocations", selectedYear, selectedMonth],
    queryFn: () => {
      const params = new URLSearchParams({ year: selectedYear.toString() });
      if (selectedMonth !== null) {
        params.append('month', selectedMonth.toString());
      }
      return fetch(`/api/reserve-allocations?${params}`).then(res => res.json());
    },
  });

  const { data: summary } = useQuery<SummaryData>({
    queryKey: ["/api/reserve-allocations/summary"],
  });

  // Get revenues and expenses for allocation calculation
  const { data: revenues } = useQuery({
    queryKey: [`/api/revenues/${selectedYear}`],
  });

  const { data: expenses } = useQuery({
    queryKey: [`/api/expenses/${selectedYear}`],
  });

  const { data: expenditures } = useQuery<ReserveExpenditure[]>({
    queryKey: ["/api/reserve-expenditures", selectedYear, selectedMonth],
    queryFn: () => {
      const params = new URLSearchParams({ year: selectedYear.toString() });
      if (selectedMonth !== null) {
        params.append('month', selectedMonth.toString());
      }
      return fetch(`/api/reserve-expenditures?${params}`).then(res => res.json());
    },
  });

  const { data: expenditureSummary } = useQuery<ExpenditureSummaryData>({
    queryKey: ["/api/reserve-expenditures/summary", selectedYear, selectedMonth],
    queryFn: () => {
      const params = new URLSearchParams({ year: selectedYear.toString() });
      if (selectedMonth !== null) {
        params.append('month', selectedMonth.toString());
      }
      return fetch(`/api/reserve-expenditures/summary/${selectedYear}?${params}`).then(res => res.json());
    },
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

  // Calculate allocations based on selected time period (year or month)
  const calculateAllocations = () => {
    if (!revenues || !expenses || !allocationAccounts) {
      return {};
    }

    const allocations: { [key: string]: number } = {};

    // If specific month is selected, calculate for that month only
    if (selectedMonth !== null) {
      // Get monthly revenue
      const monthRevenue = Array.isArray(revenues) 
        ? revenues.find((r: any) => r.month === selectedMonth)?.amount || 0 
        : 0;

      // Calculate total monthly expenses
      const monthlyExpenses = Array.isArray(expenses)
        ? expenses.filter((e: any) => e.month === selectedMonth)
            .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || '0'), 0)
        : 0;

      // Calculate net profit for the month
      const netProfit = parseFloat(monthRevenue.toString()) - monthlyExpenses;

      // Calculate allocations for each account
      allocationAccounts.forEach(account => {
        const percentage = Number(account.percentage || 0);
        const monthlyAllocation = (netProfit * percentage) / 100;
        allocations[account.name] = Math.max(0, monthlyAllocation);
      });
    } else {
      // Calculate for the entire year (existing logic)
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
        allocationAccounts.forEach(account => {
          if (!allocations[account.name]) {
            allocations[account.name] = 0;
          }
          
          const percentage = Number(account.percentage || 0);
          const monthlyAllocation = (netProfit * percentage) / 100;
          allocations[account.name] += Math.max(0, monthlyAllocation);
        });
      }
    }

    return allocations;
  };

  const currentAllocations = calculateAllocations();

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quỹ dự trữ</h1>
          <p className="text-gray-600 text-sm sm:text-base">Quản lý quỹ dự trữ</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="year" className="text-sm">Năm:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-28 sm:w-32">
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
          <div className="flex items-center space-x-2">
            <Label htmlFor="month" className="text-sm">Tháng:</Label>
            <Select 
              value={selectedMonth?.toString() || "all"} 
              onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-28 sm:w-32">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value.toString()} value={month.value.toString()}>
                    {month.label}
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
            className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="sm:inline">Thêm khoản chi</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Summary Cards based on filtered allocation accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredAllocationAccounts.slice(0, 4).map((account, index) => {
          const colorStyles = [
            { border: 'border-green-200', bg: 'bg-gradient-to-br from-green-50 to-green-100', text: 'text-green-900', icon: 'text-green-600' },
            { border: 'border-yellow-200', bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', text: 'text-yellow-900', icon: 'text-yellow-600' },
            { border: 'border-red-200', bg: 'bg-gradient-to-br from-red-50 to-red-100', text: 'text-red-900', icon: 'text-red-600' },
            { border: 'border-blue-200', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', text: 'text-blue-900', icon: 'text-blue-600' }
          ];
          const style = colorStyles[index % colorStyles.length];
          const IconComponent = getAccountTypeIcon(index);
          const amount = currentAllocations[account.name] || 0;
          
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
                  Đã phân bổ {selectedMonth !== null ? `T${selectedMonth}/${selectedYear}` : `năm ${selectedYear}`}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* Tổng phân bổ */}
        <Card className="border-tea-brown bg-gradient-to-br from-tea-light to-tea-cream">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-tea-brown">Tổng phân bổ</CardTitle>
            <Wallet className="h-4 w-4 text-tea-brown" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-tea-brown">
              {(() => {
                // Calculate total allocation for all accounts (including marketing)
                const totalAllocation = allocationAccounts.reduce((sum, account) => {
                  if (account.name === "Cổ tức") return sum; // Exclude dividend
                  return sum + (currentAllocations[account.name] || 0);
                }, 0);
                return totalAllocation ? formatCurrency(totalAllocation) : "0";
              })()}
            </div>
            <p className="text-xs text-tea-brown/70">
              Tổng phân bổ {selectedMonth !== null ? `T${selectedMonth}/${selectedYear}` : `năm ${selectedYear}`}
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
              <CardTitle>{selectedMonth !== null ? `Chi tiêu tháng ${selectedMonth}/${selectedYear}` : 'Tổng chi theo tháng'}</CardTitle>
              <p className="text-sm text-gray-600">
                {selectedMonth !== null 
                  ? `Chi tiết chi tiêu từ quỹ tháng ${selectedMonth}/${selectedYear}`
                  : `Chi tiết chi tiêu từ quỹ theo từng tháng năm ${selectedYear}`
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="mobile-table-container">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-center py-3 px-2 w-8 md:hidden"></th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Tháng</th>
                      {filteredAllocationAccounts.slice(0, 4).map((account, index) => (
                        <th key={account.id} className={`text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell`}>{account.name}</th>
                      ))}
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMonth !== null ? (
                      // Show only selected month
                      (() => {
                        const monthData = expenditureSummary?.byAccount || {};
                        const monthTotal = filteredAllocationAccounts.reduce((sum, account) => 
                          sum + (monthData[account.name] || 0), 0);
                        const isExpanded = expandedMonths.has(selectedMonth);
                        
                        return (
                          <React.Fragment key={selectedMonth}>
                            <tr className="border-b border-gray-50 hover:bg-gray-50">
                              {/* Mobile Expand Button */}
                              <td className="py-4 px-2 text-center md:hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMonthExpansion(selectedMonth)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                              
                              {/* Month */}
                              <td className="py-4 px-2 sm:px-4 font-medium text-gray-900">Tháng {selectedMonth}</td>
                              
                              {/* Account Details - Hidden on mobile */}
                              {filteredAllocationAccounts.slice(0, 4).map((account) => (
                                <td key={account.id} className="py-4 px-2 sm:px-4 text-right text-sm font-medium text-gray-900 hidden md:table-cell">
                                  <div className="truncate">{monthData[account.name] ? formatCurrency(monthData[account.name]) : "0"}</div>
                                </td>
                              ))}
                              
                              {/* Total */}
                              <td className="py-4 px-2 sm:px-4 text-right font-semibold text-gray-900">
                                <div className="truncate">
                                  <span className="md:hidden">{monthTotal > 0 ? formatMobileAmount(monthTotal) : "0"}</span>
                                  <span className="hidden md:inline">{monthTotal > 0 ? formatCurrency(monthTotal) : "0"}</span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expandable Row Details for Mobile */}
                            {isExpanded && (
                              <tr className="md:hidden border-b border-gray-50 bg-gray-50">
                                <td colSpan={3} className="px-4 py-3">
                                  <div className="space-y-2 text-sm">
                                    {filteredAllocationAccounts.slice(0, 4).map((account) => (
                                      <div key={account.id} className="flex justify-between">
                                        <span className="text-gray-600">{account.name}:</span>
                                        <span className="font-medium">
                                          {monthData[account.name] ? formatMobileAmount(monthData[account.name]) : "0"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })()
                    ) : (
                      // Show all months for the year
                      Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const monthData = expenditureSummary?.monthlyExpenditure?.[month] || {};
                        const monthTotal = filteredAllocationAccounts.reduce((sum, account) => 
                          sum + (monthData[account.name] || 0), 0);
                        const isExpanded = expandedMonths.has(month);
                        
                        return (
                          <React.Fragment key={month}>
                            <tr className="border-b border-gray-50 hover:bg-gray-50">
                              {/* Mobile Expand Button */}
                              <td className="py-4 px-2 text-center md:hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMonthExpansion(month)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                              
                              {/* Month */}
                              <td className="py-4 px-2 sm:px-4 font-medium text-gray-900">Tháng {month}</td>
                              
                              {/* Account Details - Hidden on mobile */}
                              {filteredAllocationAccounts.slice(0, 4).map((account) => (
                                <td key={account.id} className="py-4 px-2 sm:px-4 text-right text-sm font-medium text-gray-900 hidden md:table-cell">
                                  <div className="truncate">{monthData[account.name] ? formatCurrency(monthData[account.name]) : "0"}</div>
                                </td>
                              ))}
                              
                              {/* Total */}
                              <td className="py-4 px-2 sm:px-4 text-right font-semibold text-gray-900">
                                <div className="truncate">
                                  <span className="md:hidden">{monthTotal > 0 ? formatMobileAmount(monthTotal) : "0"}</span>
                                  <span className="hidden md:inline">{monthTotal > 0 ? formatCurrency(monthTotal) : "0"}</span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expandable Row Details for Mobile */}
                            {isExpanded && (
                              <tr className="md:hidden border-b border-gray-50 bg-gray-50">
                                <td colSpan={3} className="px-4 py-3">
                                  <div className="space-y-2 text-sm">
                                    {filteredAllocationAccounts.slice(0, 4).map((account) => (
                                      <div key={account.id} className="flex justify-between">
                                        <span className="text-gray-600">{account.name}:</span>
                                        <span className="font-medium">
                                          {monthData[account.name] ? formatMobileAmount(monthData[account.name]) : "0"}
                                        </span>
                                      </div>
                                    ))}
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
        </div>

        {/* Right Panel - Total Expenditure Summary (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng chi quỹ</CardTitle>
              <p className="text-sm text-gray-600">
                Tổng chi tiêu {selectedMonth !== null ? `T${selectedMonth}/${selectedYear}` : `năm ${selectedYear}`}
              </p>
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
                  <p className="text-sm text-gray-600">
                    Tổng chi {selectedMonth !== null ? 'trong tháng' : 'trong năm'}
                  </p>
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
              <p className="text-sm text-gray-600">
                Tỷ lệ chi tiêu theo loại quỹ {selectedMonth !== null ? `T${selectedMonth}/${selectedYear}` : `năm ${selectedYear}`}
              </p>
            </CardHeader>
            <CardContent>
              <ExpenditurePieChart data={(() => {
                const filteredData: { [key: string]: number } = {};
                filteredAllocationAccounts.forEach(account => {
                  const amount = expenditureSummary?.byAccount?.[account.name];
                  if (amount && amount > 0) {
                    filteredData[account.name] = amount;
                  }
                });
                return filteredData;
              })()} />
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
            <div className="mobile-table-container">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 sticky left-0 bg-white z-10 w-12">
                      <Checkbox
                        checked={selectedExpenditures.length === expenditures.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-center py-3 px-2 w-8 md:hidden"></th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">STT</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Mục chi</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Nguồn chi</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Tiền chi</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Ngày chi</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Ghi chú</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenditures.map((expenditure: ReserveExpenditure, index: number) => {
                    const isExpanded = expandedExpenditures.has(expenditure.id);
                    
                    return (
                      <React.Fragment key={expenditure.id}>
                        <tr className="border-b border-gray-50 hover:bg-gray-50">
                          {/* Checkbox */}
                          <td className="py-4 px-2 sm:px-4 sticky left-0 bg-white">
                            <Checkbox
                              checked={selectedExpenditures.includes(expenditure.id)}
                              onCheckedChange={() => toggleSelectExpenditure(expenditure.id)}
                            />
                          </td>
                          
                          {/* Mobile Expand Button */}
                          <td className="py-4 px-2 text-center md:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpenditureExpansion(expenditure.id)}
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
                          <td className="py-4 px-2 sm:px-4 text-sm font-medium text-gray-900 hidden md:table-cell">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          
                          {/* Expense Item */}
                          <td className="py-4 px-2 sm:px-4 text-sm font-medium text-gray-900">
                            <div className="truncate max-w-[120px] sm:max-w-none" title={expenditure.name}>
                              {expenditure.name}
                            </div>
                          </td>
                          
                          {/* Source Account - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-900 hidden md:table-cell">
                            <Badge className={getAccountColor(expenditure.sourceType)}>
                              {expenditure.sourceType}
                            </Badge>
                          </td>
                          
                          {/* Amount */}
                          <td className="py-4 px-2 sm:px-4 text-right text-sm font-medium text-gray-900">
                            <div className="truncate">
                              <span className="md:hidden">{formatMobileAmount(parseFloat(expenditure.amount))}</span>
                              <span className="hidden md:inline">{formatCurrency(expenditure.amount)}</span>
                            </div>
                          </td>
                          
                          {/* Date - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-900 hidden md:table-cell">
                            {new Date(expenditure.expenditureDate).toLocaleDateString('vi-VN')}
                          </td>
                          
                          {/* Notes - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-sm text-gray-600 hidden md:table-cell">
                            <div className="truncate max-w-[100px]" title={expenditure.notes || "-"}>
                              {expenditure.notes || "-"}
                            </div>
                          </td>
                          
                          {/* Actions - Hidden on mobile */}
                          <td className="py-4 px-2 sm:px-4 text-center hidden md:table-cell">
                            <div className="flex gap-1 sm:gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditExpenditure(expenditure)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteExpenditure(expenditure.id)}
                                disabled={deleteExpenditureMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
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
                                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Nguồn chi:</span>
                                  <Badge className={getAccountColor(expenditure.sourceType)}>
                                    {expenditure.sourceType}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ngày chi:</span>
                                  <span className="font-medium">
                                    {new Date(expenditure.expenditureDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ghi chú:</span>
                                  <span className="font-medium">{expenditure.notes || "-"}</span>
                                </div>
                                <div className="flex gap-2 pt-2 justify-end border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditExpenditure(expenditure)}
                                    className="h-8"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Sửa
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteExpenditure(expenditure.id)}
                                    disabled={deleteExpenditureMutation.isPending}
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  })}
                </tbody>
              </table>
            </div>
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
