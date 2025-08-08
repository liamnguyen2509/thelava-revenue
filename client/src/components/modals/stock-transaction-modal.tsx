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
import { useFormattedData } from "@/hooks/useFormattedData";
import { insertStockTransactionSchema } from "@shared/schema";
import type { InsertStockTransaction, StockItem, SystemSetting } from "@shared/schema";
import { z } from "zod";

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
  const { formatInputAmount, parseInputAmount, formatDisplayDate, currency } = useFormattedData();

  const { data: stockItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/items"],
  });

  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  // Enhanced validation schema
  const enhancedSchema = insertStockTransactionSchema.extend({
    itemId: z.string().min(1, "Vui lòng chọn hàng hóa"),
    quantity: z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      "Số lượng phải lớn hơn 0"
    ),
  });

  const form = useForm<InsertStockTransaction>({
    resolver: zodResolver(enhancedSchema),
    defaultValues: {
      itemId: "",
      type: transactionType,
      quantity: "",
      unitPrice: "",
      totalPrice: "",
      notes: "",
      transactionDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch quantity, unitPrice, and itemId for calculations and auto-population
  const watchedQuantity = form.watch("quantity");
  const watchedUnitPrice = form.watch("unitPrice");
  const watchedItemId = form.watch("itemId");

  // Auto-populate unit price when item is selected
  React.useEffect(() => {
    if (watchedItemId && stockItems) {
      const selectedItem = stockItems.find(item => item.id === watchedItemId);
      if (selectedItem && selectedItem.unitPrice) {
        form.setValue("unitPrice", selectedItem.unitPrice);
      }
    }
  }, [watchedItemId, stockItems, form]);

  // Auto-calculate total price
  React.useEffect(() => {
    const quantity = parseFloat(watchedQuantity || "0");
    const unitPrice = parseFloat(parseInputAmount(watchedUnitPrice || "0"));
    
    if (quantity > 0 && unitPrice > 0) {
      const total = quantity * unitPrice;
      form.setValue("totalPrice", total.toString());
    } else {
      form.setValue("totalPrice", "");
    }
  }, [watchedQuantity, watchedUnitPrice, form, parseInputAmount]);

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
    // Parse unit price from formatted display value
    const parsedData = {
      ...data,
      unitPrice: parseInputAmount(data.unitPrice || "0"),
      quantity: data.quantity,
      totalPrice: data.totalPrice,
    };
    createMutation.mutate(parsedData);
  };

  // Helper function to format date for display (dd/mm/yyyy)
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to parse dd/mm/yyyy to yyyy-mm-dd
  const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return new Date().toISOString().split('T')[0];
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
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
                          {item.name} - {item.unit}
                          {item.unitPrice && ` - ${formatInputAmount(item.unitPrice)} ${currency}`}
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
                    <FormLabel>Số lượng *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nhập số lượng"
                        step="1"
                        min="0"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || parseInt(value) >= 0) {
                            field.onChange(value);
                          }
                        }}
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
                        type="text"
                        placeholder="dd/mm/yyyy"
                        {...field}
                        value={field.value ? formatDateForDisplay(field.value) : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only numbers and slashes
                          const cleaned = value.replace(/[^0-9\/]/g, '');
                          if (cleaned.length <= 10) {
                            const parsed = parseDateFromDisplay(cleaned.length === 10 ? cleaned : new Date().toISOString().split('T')[0]);
                            field.onChange(parsed);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value.length === 10) {
                            const parsed = parseDateFromDisplay(value);
                            field.onChange(parsed);
                          }
                        }}
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
                    <FormLabel>Giá đơn vị ({currency})</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0"
                        {...field}
                        value={field.value ? formatInputAmount(field.value) : ""}
                        onChange={(e) => {
                          const rawValue = parseInputAmount(e.target.value);
                          field.onChange(rawValue);
                        }}
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
                    <FormLabel>Tổng tiền ({currency})</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0"
                        readOnly
                        {...field}
                        value={field.value ? formatInputAmount(field.value) : ""}
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
                      value={field.value || ""}
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