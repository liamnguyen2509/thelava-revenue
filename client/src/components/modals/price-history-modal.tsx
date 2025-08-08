import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package } from "lucide-react";
import { useFormattedData } from "@/hooks/useFormattedData";
import type { StockItem } from "@shared/schema";

interface PriceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
}

interface PriceHistoryEntry {
  date: string;
  price: string;
  type: string;
  quantity: string;
  notes?: string;
}

export default function PriceHistoryModal({ 
  open, 
  onOpenChange, 
  item 
}: PriceHistoryModalProps) {
  const { formatMoney, formatDisplayDate } = useFormattedData();

  const { data: priceHistory, isLoading } = useQuery<PriceHistoryEntry[]>({
    queryKey: ["/api/stock/items", item?.id, "price-history"],
    queryFn: () => fetch(`/api/stock/items/${item?.id}/price-history`).then(res => res.json()),
    enabled: !!item?.id && open,
  });

  const getTransactionTypeBadge = (type: string) => {
    if (type === "in") {
      return <Badge className="bg-green-100 text-green-800">Nhập</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Xuất</Badge>;
    }
  };

  const getPriceChangeIcon = (currentPrice: string, previousPrice?: string) => {
    if (!previousPrice) return null;
    
    const current = parseFloat(currentPrice);
    const previous = parseFloat(previousPrice);
    
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const calculatePriceChange = (currentPrice: string, previousPrice?: string) => {
    if (!previousPrice) return null;
    
    const current = parseFloat(currentPrice);
    const previous = parseFloat(previousPrice);
    const change = ((current - previous) / previous) * 100;
    
    if (Math.abs(change) < 0.01) return null;
    
    return (
      <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        ({change > 0 ? '+' : ''}{change.toFixed(1)}%)
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Lịch sử giá - {item?.name}</DialogTitle>
          <DialogDescription>
            Theo dõi sự thay đổi giá của sản phẩm qua các giao dịch
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {priceHistory && priceHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Package className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium">Giá hiện tại: {formatMoney(parseFloat(item?.unitPrice || '0'))}</p>
                    <p className="text-sm text-gray-600">
                      {priceHistory.length} giao dịch có giá ghi nhận
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày giao dịch</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Giá tại thời điểm</TableHead>
                      <TableHead className="text-right">Thay đổi</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.map((entry, index) => {
                      const previousPrice = index < priceHistory.length - 1 
                        ? priceHistory[index + 1].price 
                        : undefined;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {formatDisplayDate(entry.date)}
                          </TableCell>
                          <TableCell>
                            {getTransactionTypeBadge(entry.type)}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(entry.quantity).toLocaleString('vi-VN')} {item?.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-medium">
                                {formatMoney(parseFloat(entry.price))}
                              </span>
                              {getPriceChangeIcon(entry.price, previousPrice)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {calculatePriceChange(entry.price, previousPrice)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {entry.notes || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Chưa có lịch sử giá nào được ghi nhận</p>
                <p className="text-sm mt-1">
                  Lịch sử giá sẽ được ghi nhận từ các giao dịch nhập/xuất kho có giá
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}