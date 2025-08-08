import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFormattedData } from "@/hooks/useFormattedData";
import { insertStockItemSchema } from "@shared/schema";
import type { InsertStockItem, StockItem } from "@shared/schema";

interface StockItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: StockItem | null;
}

export default function StockItemModal({ 
  open, 
  onOpenChange, 
  editingItem 
}: StockItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatInputAmount, parseInputAmount } = useFormattedData();
  const isEditing = Boolean(editingItem);

  const form = useForm<InsertStockItem>({
    resolver: zodResolver(insertStockItemSchema),
    defaultValues: {
      name: editingItem?.name || "",
      unit: editingItem?.unit || "",
      unitPrice: editingItem?.unitPrice || "",
      currentStock: editingItem?.currentStock || "0",
      minStock: editingItem?.minStock || "0",
    },
  });

  // Reset form when editingItem changes
  React.useEffect(() => {
    if (editingItem) {
      form.reset({
        name: editingItem.name,
        unit: editingItem.unit,
        unitPrice: editingItem.unitPrice,
        currentStock: editingItem.currentStock,
        minStock: editingItem.minStock,
      });
    } else {
      form.reset({
        name: "",
        unit: "",
        unitPrice: "",
        currentStock: "0",
        minStock: "0",
      });
    }
  }, [editingItem, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertStockItem) => {
      const endpoint = isEditing 
        ? `/api/stock/items/${editingItem!.id}`
        : "/api/stock/items";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await apiRequest(endpoint, method, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      toast({
        title: "Thành công",
        description: isEditing 
          ? "Đã cập nhật hàng hóa thành công" 
          : "Đã thêm hàng hóa thành công",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Stock item error:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lưu hàng hóa",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStockItem) => {
    createMutation.mutate(data);
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa hàng hóa" : "Thêm hàng hóa mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Cập nhật thông tin hàng hóa trong kho"
              : "Thêm hàng hóa mới vào hệ thống quản lý kho"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên hàng hóa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên hàng hóa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: kg, túi, hộp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá thành (VNĐ) *</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tồn kho hiện tại</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tồn kho tối thiểu</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  ? (isEditing ? "Đang cập nhật..." : "Đang thêm...")
                  : (isEditing ? "Cập nhật" : "Thêm hàng hóa")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}