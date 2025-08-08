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
import { insertReserveExpenditureSchema } from "@shared/schema";
import type { InsertReserveExpenditure, ReserveExpenditure, AllocationAccount, SystemSetting } from "@shared/schema";

interface ReserveExpenditureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenditure?: ReserveExpenditure | null;
}

export default function ReserveExpenditureModal({
  open,
  onOpenChange,
  expenditure,
}: ReserveExpenditureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!expenditure;

  // Fetch allocation accounts from settings
  const { data: allocationAccounts = [] } = useQuery<AllocationAccount[]>({
    queryKey: ["/api/settings/allocation-accounts"],
  });

  // Fetch system settings for currency
  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  const getCurrency = () => {
    const currencySetting = systemSettings.find((s) => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  const form = useForm<InsertReserveExpenditure>({
    resolver: zodResolver(insertReserveExpenditureSchema),
    defaultValues: {
      name: "",
      sourceType: "",
      amount: "",
      expenditureDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Helper function to format amount with dots
  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('vi-VN').replace(/,/g, '.');
  };

  // Reset form when expenditure prop changes
  React.useEffect(() => {
    if (expenditure) {
      form.reset({
        name: expenditure.name,
        sourceType: expenditure.sourceType,
        amount: formatAmount(parseFloat(expenditure.amount.toString())), // Format with dots
        expenditureDate: expenditure.expenditureDate,
        notes: expenditure.notes ?? "",
      });
    } else {
      form.reset({
        name: "",
        sourceType: "",
        amount: "",
        expenditureDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
    }
  }, [expenditure, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertReserveExpenditure) => {
      const res = await apiRequest("/api/reserve-expenditures", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures/summary"] });
      toast({
        title: "Thành công",
        description: "Đã tạo khoản chi mới",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo khoản chi",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertReserveExpenditure) => {
      const res = await apiRequest(`/api/reserve-expenditures/${expenditure?.id}`, "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reserve-expenditures/summary"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật khoản chi",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật khoản chi",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertReserveExpenditure) => {
    // Process data for submission
    const formattedData = {
      ...data,
      amount: data.amount.replace(/\./g, ''), // Remove dots for submission
      expenditureDate: data.expenditureDate,
    };
    
    if (isEditing) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa khoản chi" : "Thêm khoản chi"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Cập nhật thông tin khoản chi từ quỹ dự trữ." : "Tạo một khoản chi mới từ quỹ dự trữ."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khoản chi</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên khoản chi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nguồn chi</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nguồn chi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allocationAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.name}>
                          {account.name}
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
                  <FormLabel>Tiền chi ({getCurrency()})</FormLabel>
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
              name="expenditureDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày chi</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập ghi chú (tùy chọn)"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending 
                  ? (isEditing ? "Đang cập nhật..." : "Đang tạo...") 
                  : (isEditing ? "Cập nhật" : "Tạo khoản chi")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}