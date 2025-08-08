import React from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
      expenseDate: new Date().toISOString().split('T')[0],
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
    // Process data for submission
    const expenseDate = new Date(data.expenseDate as string);
    const processedData = {
      ...data,
      amount: data.amount.toString().replace(/\./g, ''), // Remove dots for submission
      expenseDate: data.expenseDate as string,
      year: expenseDate.getFullYear(),
      month: expenseDate.getMonth() + 1,
    };
    expenseMutation.mutate(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Thêm chi phí mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi phí hàng tháng cho cửa hàng trà sữa
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên chi phí</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên chi phí" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại chi phí</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại chi phí" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền ({getCurrency()})</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        // Remove all non-digits
                        let value = e.target.value.replace(/\D/g, '');
                        // Format with dots as thousands separators
                        if (value) {
                          value = parseInt(value).toLocaleString('vi-VN').replace(/,/g, '.');
                        }
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày chi phí</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Fix date selection issue by ensuring proper timezone handling
                            const year = date.getFullYear();
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const day = date.getDate().toString().padStart(2, '0');
                            field.onChange(`${year}-${month}-${day}`);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú thêm"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
