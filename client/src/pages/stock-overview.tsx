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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFormattedData } from "@/hooks/useFormattedData";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StockItemModal from "@/components/modals/stock-item-modal.tsx";
import PriceHistoryModal from "@/components/modals/price-history-modal.tsx";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  History,
} from "lucide-react";
import type { StockItem } from "@shared/schema";

interface StockSummary {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
}

type StockItemWithSummary = StockItem & { totalIn: number; totalOut: number };

export default function StockOverview() {
  const [isStockItemModalOpen, setIsStockItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [priceHistoryItem, setPriceHistoryItem] = useState<StockItem | null>(null);
  const { formatMoney } = useFormattedData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockItems, isLoading: itemsLoading } = useQuery<StockItemWithSummary[]>({
    queryKey: ["/api/stock/items"],
    queryFn: () => fetch('/api/stock/items?withSummary=true').then(res => res.json()),
  });

  const { data: stockSummary, isLoading: summaryLoading } = useQuery<StockSummary>({
    queryKey: ["/api/stock/summary"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/stock/items/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
      toast({
        title: "Thành công",
        description: "Đã xóa hàng hóa thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa hàng hóa",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest('/api/stock/items', 'DELETE', { ids });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      setSelectedItems([]);
      setIsBulkDeleteDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã xóa các hàng hóa đã chọn",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa hàng hóa",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setIsStockItemModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      deleteMutation.mutate(deleteItemId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      setIsBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedItems);
  };

  const handleViewPriceHistory = (item: StockItem) => {
    setPriceHistoryItem(item);
    setIsPriceHistoryModalOpen(true);
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === stockItems?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(stockItems?.map(item => item.id) || []);
    }
  };

  const getStatusBadge = (item: StockItem) => {
    const currentStock = parseFloat(item.currentStock);
    const minStock = parseFloat(item.minStock);
    
    if (currentStock === 0) {
      return <Badge variant="destructive">Hết hàng</Badge>;
    } else if (currentStock <= minStock) {
      return <Badge variant="secondary">Sắp hết</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">Còn hàng</Badge>;
    }
  };

  const isLoading = itemsLoading || summaryLoading;

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tổng quan kho hàng</h1>
          <p className="text-gray-600 text-sm sm:text-base">Theo dõi tình trạng kho hàng tổng thể</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {selectedItems.length > 0 && (
            <Button 
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={bulkDeleteMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa {selectedItems.length} mục
            </Button>
          )}
          <Button 
            onClick={() => {
              setEditingItem(null);
              setIsStockItemModalOpen(true);
            }}
            className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm hàng hóa
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng mặt hàng</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stockSummary?.totalItems || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">hàng hóa đang quản lý</p>
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
                  {stockSummary?.lowStockItems || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">mặt hàng cần nhập thêm</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng giá trị kho</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatMoney(stockSummary?.totalValue || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">ước tính theo giá gần nhất</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hàng hóa</CardTitle>
        </CardHeader>
        <CardContent>
          {stockItems && stockItems.length > 0 ? (
            <div className="mobile-table-container">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 sticky left-0 bg-white z-10 w-12">
                      <Checkbox 
                        checked={selectedItems.length === stockItems?.length && stockItems?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Tên hàng hóa</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden sm:table-cell">Đơn vị</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Giá thành</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Nhập kho</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden md:table-cell">Xuất kho</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Tồn kho</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4 hidden lg:table-cell">Trạng thái</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-2 sm:px-4 sticky left-0 bg-white">
                        <Checkbox 
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </td>
                      <td className="py-4 px-2 sm:px-4 font-medium text-gray-900">
                        <div className="truncate max-w-[120px] sm:max-w-none" title={item.name}>
                          {item.name}
                        </div>
                        <div className="sm:hidden text-xs text-gray-500 mt-1">
                          {item.unit}
                        </div>
                        <div className="lg:hidden text-xs mt-1">
                          {getStatusBadge(item)}
                        </div>
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-sm text-gray-600 hidden sm:table-cell">
                        {item.unit}
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-right">
                        <Button
                          variant="ghost"
                          className="h-auto p-1 text-right hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleViewPriceHistory(item)}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm">
                              {formatMoney(parseFloat(item.unitPrice || '0'))}
                            </span>
                            <History className="h-3 w-3 opacity-60" />
                          </div>
                        </Button>
                        <div className="md:hidden text-xs text-gray-500 mt-1">
                          <div className="flex justify-between">
                            <span className="text-green-600">Nhập: {(item.totalIn || 0).toLocaleString('vi-VN')}</span>
                            <span className="text-red-600">Xuất: {(item.totalOut || 0).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-right hidden md:table-cell">
                        <span className="text-green-600 font-medium text-sm">
                          {(item.totalIn || 0).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-right hidden md:table-cell">
                        <span className="text-red-600 font-medium text-sm">
                          {(item.totalOut || 0).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-right text-sm font-medium text-gray-900">
                        <div className="truncate">
                          {parseFloat(item.currentStock).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-4 px-2 sm:px-4 hidden lg:table-cell">
                        {getStatusBadge(item)}
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-center">
                        <div className="flex gap-1 sm:gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Chưa có hàng hóa nào được thêm</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setEditingItem(null);
                  setIsStockItemModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm hàng hóa đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Item Modal */}
      <StockItemModal
        open={isStockItemModalOpen}
        onOpenChange={(open: boolean) => {
          setIsStockItemModalOpen(open);
          if (!open) setEditingItem(null);
        }}
        editingItem={editingItem}
      />

      {/* Price History Modal */}
      <PriceHistoryModal
        open={isPriceHistoryModalOpen}
        onOpenChange={(open: boolean) => {
          setIsPriceHistoryModalOpen(open);
          if (!open) setPriceHistoryItem(null);
        }}
        item={priceHistoryItem}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa hàng hóa này? Hành động này không thể hoàn tác.
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
              Bạn có chắc muốn xóa {selectedItems.length} hàng hóa đã chọn? Hành động này không thể hoàn tác.
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
