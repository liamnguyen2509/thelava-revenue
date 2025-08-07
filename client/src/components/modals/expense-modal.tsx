import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertExpenseSchema, type InsertExpense, type ExpenseCategory, type SystemSetting } from "@shared/schema";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const expenseStatuses = [
  { value: "spent", label: "Đã chi" },
  { value: "draft", label: "Nháp" },
];

export function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch expense categories from settings
  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/settings/expense-categories"],
  });

  // Fetch system settings for currency
  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  const getCurrency = () => {
    const currencySetting = systemSettings.find(s => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      name: "",
      category: "",
      amount: "0",
      expenseDate: new Date().toISOString().split('T')[0] as any,
      status: "spent",
      notes: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  });

  const expenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await apiRequest("/api/expenses", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Thành công",
        description: "Chi phí đã được thêm thành công",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi thêm chi phí",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertExpense) => {
    const expenseDate = new Date(data.expenseDate);
    const processedData = {
      ...data,
      year: expenseDate.getFullYear(),
      month: expenseDate.getMonth() + 1,
    };
    expenseMutation.mutate(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chi phí mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi phí hàng tháng cho cửa hàng trà sữa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên chi phí</Label>
            <Input
              id="name"
              placeholder="Nhập tên chi phí"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Loại chi phí</Label>
            <Select onValueChange={(value) => form.setValue("category", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại chi phí" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền ({getCurrency()})</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseDate">Ngày chi phí</Label>
            <Input
              id="expenseDate"
              type="date"
              {...form.register("expenseDate")}
            />
            {form.formState.errors.expenseDate && (
              <p className="text-sm text-destructive">{form.formState.errors.expenseDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select onValueChange={(value) => form.setValue("status", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {expenseStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú thêm"
              rows={3}
              {...form.register("notes")}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-tea-brown hover:bg-tea-brown/90"
              disabled={expenseMutation.isPending}
            >
              {expenseMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
