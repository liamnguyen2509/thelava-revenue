import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFormattedData } from "@/hooks/useFormattedData";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StockTransactionModal from "@/components/modals/stock-transaction-modal";
import {
  Plus,
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
} from "lucide-react";
import type { StockItem, StockTransaction } from "@shared/schema";

export default function StockIn() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { formatMoney, formatDisplayDate } = useFormattedData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockItems, isLoading: itemsLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/items"],
  });

  const { data: stockTransactions, isLoading: transactionsLoading } = useQuery<StockTransaction[]>({
    queryKey: ["/api/stock/transactions"],
  });

  // Filter stock-in transactions only
  const stockInTransactions = stockTransactions?.filter(t => t.type === 'in') || [];

  // Get unique categories for filter
  const categories = Array.from(new Set(
    stockItems?.map(item => item.category)
      .filter(category => category && category.trim() !== '') || []
  ));

  // Filter transactions based on search and category
  const filteredTransactions = stockInTransactions.filter(transaction => {
    const item = stockItems?.find(item => item.id === transaction.itemId);
    if (!item) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Nhập kho</h1>
          <p className="text-gray-600">Quản lý việc nhập hàng vào kho</p>
        </div>
        <Button 
          onClick={() => setIsTransactionModalOpen(true)}
          className="bg-tea-brown hover:bg-tea-brown/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nhập hàng mới
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng lần nhập</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stockInTransactions.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">giao dịch nhập kho</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số lượng</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stockInTransactions.reduce((total, t) => total + parseFloat(t.quantity), 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-gray-500 mt-1">sản phẩm đã nhập</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Download className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatMoney(
                    stockInTransactions.reduce((total, t) => 
                      total + (parseFloat(t.totalPrice || '0')), 0
                    )
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">tổng tiền nhập hàng</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập kho</CardTitle>
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
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transactions Table */}
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày nhập</TableHead>
                  <TableHead>Hàng hóa</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Giá đơn vị</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const item = stockItems?.find(item => item.id === transaction.itemId);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {formatDisplayDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item?.name || 'Không rõ'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item?.category || 'Không rõ'}</Badge>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Chưa có giao dịch nhập kho nào</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsTransactionModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nhập hàng đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Transaction Modal */}
      <StockTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        transactionType="in"
      />
    </div>
  );
}
