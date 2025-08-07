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
import { insertReserveExpenditureSchema } from "@shared/schema";
import type { InsertReserveExpenditure, ReserveExpenditure, AllocationAccount } from "@shared/schema";

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
  const { data: systemSettings = [] } = useQuery({
    queryKey: ["/api/settings/system"],
  });

  const getCurrency = () => {
    const currencySetting = systemSettings.find((s: any) => s.key === "currency");
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

  // Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format date from DD/MM/YYYY to YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

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
        amount: formatAmount(expenditure.amount), // Format with dots
        expenditureDate: formatDateForDisplay(expenditure.expenditureDate),
        notes: expenditure.notes || "",
      });
    } else {
      form.reset({
        name: "",
        sourceType: "",
        amount: "",
        expenditureDate: formatDateForDisplay(new Date().toISOString()),
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
    // Convert date from DD/MM/YYYY to YYYY-MM-DD format and amount to number
    const formattedData = {
      ...data,
      amount: data.amount.replace(/\./g, ''), // Remove dots for submission
      expenditureDate: formatDateForInput(data.expenditureDate),
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
      <DialogContent className="sm:max-w-[500px]">
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
                      onBlur={(e) => {
                        // Convert formatted value back to number for form validation
                        const numericValue = e.target.value.replace(/\./g, '');
                        field.onChange(numericValue);
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
                  <FormControl>
                    <Input 
                      placeholder="dd/mm/yyyy"
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        if (value.length >= 5) {
                          value = value.slice(0, 5) + '/' + value.slice(5, 9);
                        }
                        field.onChange(value);
                      }}
                      maxLength={10}
                    />
                  </FormControl>
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