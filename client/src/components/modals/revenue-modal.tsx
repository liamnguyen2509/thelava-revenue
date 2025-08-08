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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRevenueSchema } from "@shared/schema";
import type { InsertRevenue, SystemSetting } from "@shared/schema";

interface RevenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RevenueModal({ open, onOpenChange }: RevenueModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Fetch system settings for currency
  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  const getCurrency = () => {
    const currencySetting = systemSettings.find((s) => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  // Generate months array
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const form = useForm<InsertRevenue>({
    resolver: zodResolver(insertRevenueSchema),
    defaultValues: {
      year: currentYear,
      month: currentMonth,
      amount: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRevenue) => {
      // Check if revenue for this month/year already exists
      const existingRevenues = await fetch(`/api/revenues/${data.year}`).then(res => res.json());
      const existingRevenue = Array.isArray(existingRevenues) 
        ? existingRevenues.find((r: any) => r.month === data.month)
        : null;

      if (existingRevenue) {
        // Update existing revenue
        const res = await apiRequest(`/api/revenues/${existingRevenue.id}`, "PUT", data);
        return res.json();
      } else {
        // Create new revenue
        const res = await apiRequest("/api/revenues", "POST", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/revenues/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật doanh thu thành công",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật doanh thu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRevenue) => {
    // Remove dots from amount and convert to string for submission
    const processedData = {
      ...data,
      amount: data.amount.toString().replace(/\./g, ''),
    };
    createMutation.mutate(processedData);
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Cập nhật doanh thu</DialogTitle>
          <DialogDescription>
            Cập nhật doanh thu theo tháng cho cửa hàng
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tháng</FormLabel>
                  <Select 
                    value={field.value?.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tháng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
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
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Năm</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2025"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doanh thu ({getCurrency()})</FormLabel>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending} className="bg-tea-brown hover:bg-tea-brown/90">
                {isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}