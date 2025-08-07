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
import type { InsertReserveExpenditure, ReserveExpenditure } from "@shared/schema";

interface ReserveExpenditureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenditure?: ReserveExpenditure | null;
}

const sourceTypes = [
  { value: "reinvestment", label: "Tái đầu tư" },
  { value: "depreciation", label: "Khấu hao" },
  { value: "risk_reserve", label: "Rủi ro" },
  { value: "staff_bonus", label: "Lương thưởng" },
];

export default function ReserveExpenditureModal({
  open,
  onOpenChange,
  expenditure,
}: ReserveExpenditureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!expenditure;

  const form = useForm<InsertReserveExpenditure>({
    resolver: zodResolver(insertReserveExpenditureSchema),
    defaultValues: {
      name: expenditure?.name || "",
      sourceType: expenditure?.sourceType || "",
      amount: expenditure?.amount?.toString() || "",
      expenditureDate: expenditure?.expenditureDate || new Date().toISOString().split('T')[0],
      notes: expenditure?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReserveExpenditure) => {
      const res = await apiRequest("POST", "/api/reserve-expenditures", data);
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
      const res = await apiRequest("PUT", `/api/reserve-expenditures/${expenditure?.id}`, data);
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
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
                      {sourceTypes.map((type) => (
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
                  <FormLabel>Tiền chi (VNĐ)</FormLabel>
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

            <FormField
              control={form.control}
              name="expenditureDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày chi</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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