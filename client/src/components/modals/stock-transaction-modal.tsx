import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStockTransactionSchema } from "@shared/schema";
import type { InsertStockTransaction, StockItem } from "@shared/schema";

interface StockTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: "in" | "out";
}

export default function StockTransactionModal({ 
  open, 
  onOpenChange, 
  transactionType 
}: StockTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/items"],
  });

  const form = useForm<InsertStockTransaction>({
    resolver: zodResolver(insertStockTransactionSchema),
    defaultValues: {
      itemId: undefined,
      type: transactionType,
      quantity: "0",
      unitPrice: "0",
      totalPrice: "0",
      notes: "",
      transactionDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch quantity and unitPrice to auto-calculate totalPrice
  const watchedQuantity = form.watch("quantity");
  const watchedUnitPrice = form.watch("unitPrice");

  React.useEffect(() => {
    const quantity = parseFloat(watchedQuantity || "0");
    const unitPrice = parseFloat(watchedUnitPrice || "0");
    
    if (quantity > 0 && unitPrice > 0) {
      const total = quantity * unitPrice;
      form.setValue("totalPrice", total.toString());
    } else {
      form.setValue("totalPrice", "");
    }
  }, [watchedQuantity, watchedUnitPrice, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertStockTransaction) => {
      const res = await apiRequest("/api/stock/transactions", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      toast({
        title: "Thành công",
        description: transactionType === "in" 
          ? "Đã nhập hàng thành công" 
          : "Đã xuất hàng thành công",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Stock transaction error:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể thực hiện giao dịch",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStockTransaction) => {
    createMutation.mutate(data);
  };

  const isPending = createMutation.isPending;

  const getTitle = () => {
    return transactionType === "in" ? "Nhập hàng" : "Xuất hàng";
  };

  const getDescription = () => {
    return transactionType === "in" 
      ? "Thêm hàng hóa vào kho" 
      : "Xuất hàng hóa từ kho";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hàng hóa</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hàng hóa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stockItems?.filter(item => item.id && item.id.trim() !== '').map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.category}) - {item.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày giao dịch</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá đơn vị (VNĐ)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tổng tiền (VNĐ)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        readOnly
                        {...field}
                        value={field.value || ""}
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú về giao dịch (tùy chọn)"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={isPending} 
                className="bg-tea-brown hover:bg-tea-brown/90"
              >
                {isPending 
                  ? "Đang xử lý..." 
                  : (transactionType === "in" ? "Nhập hàng" : "Xuất hàng")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}