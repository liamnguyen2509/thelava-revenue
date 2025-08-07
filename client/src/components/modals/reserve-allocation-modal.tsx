import { useState } from "react";
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
import { insertReserveAllocationSchema } from "@shared/schema";
import type { InsertReserveAllocation } from "@shared/schema";

interface ReserveAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accountTypes = [
  { value: "reinvestment", label: "Tái đầu tư" },
  { value: "depreciation", label: "Khấu hao" },
  { value: "risk_reserve", label: "Dự phòng rủi ro" },
  { value: "staff_bonus", label: "Thưởng nhân viên" },
  { value: "dividends", label: "Cổ tức" },
  { value: "marketing", label: "Marketing" },
];

export default function ReserveAllocationModal({
  open,
  onOpenChange,
}: ReserveAllocationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertReserveAllocation>({
    resolver: zodResolver(insertReserveAllocationSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      accountType: "",
      amount: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReserveAllocation) => {
      const res = await apiRequest("POST", "/api/reserve-allocations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-allocations/summary"] });
      toast({
        title: "Thành công",
        description: "Đã tạo phân bổ quỹ dự trữ mới",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo phân bổ quỹ dự trữ",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertReserveAllocation) => {
    createMutation.mutate(data);
  };

  const months = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm phân bổ quỹ dự trữ</DialogTitle>
          <DialogDescription>
            Tạo một khoản phân bổ quỹ dự trữ mới cho tháng và năm được chọn.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
            </div>

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại tài khoản</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại tài khoản" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                  <FormLabel>Số tiền (VNĐ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo phân bổ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}