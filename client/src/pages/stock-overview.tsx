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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFormattedData } from "@/hooks/useFormattedData";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StockItemModal from "@/components/modals/stock-item-modal.tsx";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import type { StockItem } from "@shared/schema";

interface StockSummary {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
}

export default function StockOverview() {
  const [isStockItemModalOpen, setIsStockItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const { formatMoney } = useFormattedData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockItems, isLoading: itemsLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/items"],
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

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setIsStockItemModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa hàng hóa này?")) {
      deleteMutation.mutate(id);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan kho hàng</h1>
          <p className="text-gray-600">Theo dõi tình trạng kho hàng tổng thể</p>
        </div>
        <Button 
          onClick={() => {
            setEditingItem(null);
            setIsStockItemModalOpen(true);
          }}
          className="bg-tea-brown hover:bg-tea-brown/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm hàng hóa
        </Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên hàng hóa</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Tồn kho tối thiểu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(item.currentStock).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      {parseFloat(item.minStock).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
}
