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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFormattedData } from "@/hooks/useFormattedData";
import { insertStockTransactionSchema, insertStockItemSchema } from "@shared/schema";
import type { InsertStockTransaction, StockItem, SystemSetting, InsertStockItem, StockTransaction } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StockTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: "in" | "out";
  editingTransaction?: StockTransaction | null;
}

export default function StockTransactionModal({ 
  open, 
  onOpenChange, 
  transactionType,
  editingTransaction 
}: StockTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatInputAmount, parseInputAmount, formatDisplayDate, currency } = useFormattedData();
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = React.useState(false);
  const [stockWarning, setStockWarning] = React.useState<string | null>(null);
  const [hasStockError, setHasStockError] = React.useState(false);

  const { data: stockItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock/items"],
  });

  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  // Enhanced validation schema with stock validation for out transactions
  const enhancedSchema = insertStockTransactionSchema.extend({
    itemId: z.string().min(1, "Vui lòng chọn hàng hóa"),
    quantity: z.string().refine(
      (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          return false;
        }
        
        // Additional validation for stock-out transactions
        if (transactionType === "out" && watchedItemId && stockItems) {
          const selectedItem = stockItems.find(item => item.id === watchedItemId);
          if (selectedItem) {
            const availableStock = parseFloat(selectedItem.currentStock);
            return num <= availableStock;
          }
        }
        
        return true;
      },
      (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          return "Số lượng phải lớn hơn 0";
        }
        
        if (transactionType === "out" && watchedItemId && stockItems) {
          const selectedItem = stockItems.find(item => item.id === watchedItemId);
          if (selectedItem) {
            const availableStock = parseFloat(selectedItem.currentStock);
            if (num > availableStock) {
              return `Số lượng xuất không thể vượt quá tồn kho hiện tại (${availableStock.toLocaleString('vi-VN')} ${selectedItem.unit})`;
            }
          }
        }
        
        return "Số lượng phải lớn hơn 0";
      }
    ),
  });

  // Quick add product form (category removed as requested)
  const quickAddSchema = insertStockItemSchema
    .omit({ category: true })
    .extend({
      name: z.string().min(1, "Tên hàng hóa là bắt buộc"),
      unit: z.string().min(1, "Đơn vị là bắt buộc"),
      unitPrice: z.string().min(1, "Giá thành là bắt buộc"),
    });

  const quickAddForm = useForm<Omit<InsertStockItem, 'category'>>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: "",
      unit: "",
      unitPrice: "",
      currentStock: "0",
      minStock: "0",
      isActive: true,
    },
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

  // Reset form when editing transaction changes or modal opens
  React.useEffect(() => {
    if (open) {
      if (editingTransaction) {
        // Editing mode - populate form with existing data
        form.reset({
          itemId: editingTransaction.itemId,
          type: editingTransaction.type as "in" | "out",
          quantity: editingTransaction.quantity,
          unitPrice: editingTransaction.unitPrice || "",
          totalPrice: editingTransaction.totalPrice || "",
          notes: editingTransaction.notes || "",
          transactionDate: editingTransaction.transactionDate,
        });
      } else {
        // Creating mode - reset to defaults
        form.reset({
          itemId: "",
          type: transactionType,
          quantity: "",
          unitPrice: "",
          totalPrice: "",
          notes: "",
          transactionDate: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [open, editingTransaction, transactionType, form]);

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

  // Auto-calculate total price and check stock validation
  React.useEffect(() => {
    const quantity = parseFloat(watchedQuantity || "0");
    const unitPrice = parseFloat(parseInputAmount(watchedUnitPrice || "0"));
    
    if (quantity > 0 && unitPrice > 0) {
      const total = quantity * unitPrice;
      form.setValue("totalPrice", total.toString());
    } else {
      form.setValue("totalPrice", "");
    }
    
    // Check stock validation for out transactions
    if (transactionType === "out" && watchedItemId && stockItems && watchedQuantity) {
      const selectedItem = stockItems.find(item => item.id === watchedItemId);
      if (selectedItem) {
        const availableStock = parseFloat(selectedItem.currentStock);
        const requestedQuantity = parseFloat(watchedQuantity);
        
        if (requestedQuantity > availableStock) {
          setStockWarning(`⚠️ Cảnh báo: Số lượng tồn kho hiện tại chỉ còn ${availableStock.toLocaleString('vi-VN')} ${selectedItem.unit}`);
          setHasStockError(true);
        } else {
          setStockWarning(null);
          setHasStockError(false);
        }
      }
    } else {
      setStockWarning(null);
      setHasStockError(false);
    }
  }, [watchedQuantity, watchedUnitPrice, watchedItemId, stockItems, transactionType, form, parseInputAmount]);

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

  const updateMutation = useMutation({
    mutationFn: async (data: InsertStockTransaction) => {
      const res = await apiRequest(`/api/stock/transactions/${editingTransaction?.id}`, "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/summary"] });
      toast({
        title: "Thành công",
        description: "Cập nhật giao dịch thành công",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Stock transaction update error:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể cập nhật giao dịch",
        variant: "destructive",
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertStockItem) => {
      const res = await apiRequest("/api/stock/items", "POST", data);
      return res.json();
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/items"] });
      toast({
        title: "Thành công",
        description: "Đã thêm sản phẩm mới",
      });
      // Auto-select the newly created product
      form.setValue("itemId", newProduct.id);
      // Close quick add form
      setShowQuickAdd(false);
      quickAddForm.reset();
    },
    onError: (error: any) => {
      console.error("Create product error:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tạo sản phẩm mới",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = (data: Omit<InsertStockItem, 'category'>) => {
    const parsedData = {
      ...data,
      category: "", // Default empty category since it's not required
      unitPrice: parseInputAmount(data.unitPrice || "0"),
      currentStock: data.currentStock || "0",
      minStock: data.minStock || "0",
    };
    setIsCreatingProduct(true);
    createProductMutation.mutate(parsedData);
  };

  React.useEffect(() => {
    if (!createProductMutation.isPending) {
      setIsCreatingProduct(false);
    }
  }, [createProductMutation.isPending]);

  const onSubmit = (data: InsertStockTransaction) => {
    // Parse unit price from formatted display value
    const parsedData = {
      ...data,
      unitPrice: parseInputAmount(data.unitPrice || "0"),
      quantity: data.quantity,
      totalPrice: data.totalPrice,
    };
    
    if (editingTransaction) {
      updateMutation.mutate(parsedData);
    } else {
      createMutation.mutate(parsedData);
    }
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

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isEditMode = !!editingTransaction;

  const getTitle = () => {
    if (isEditMode) {
      return transactionType === "in" ? "Sửa giao dịch nhập" : "Sửa giao dịch xuất";
    }
    return transactionType === "in" ? "Nhập hàng" : "Xuất hàng";
  };

  const getDescription = () => {
    if (isEditMode) {
      return transactionType === "in" 
        ? "Cập nhật thông tin giao dịch nhập hàng" 
        : "Cập nhật thông tin giao dịch xuất hàng";
    }
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="shrink-0"
                      >
                        {showQuickAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Quick Add Product Form - Restructured to avoid form nesting */}
                    {showQuickAdd && (
                      <Card className="border-dashed">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Thêm sản phẩm nhanh</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium">Tên sản phẩm *</label>
                                <Input
                                  placeholder="Tên sản phẩm"
                                  value={quickAddForm.watch("name") || ""}
                                  onChange={(e) => quickAddForm.setValue("name", e.target.value)}
                                  className="h-8 mt-1"
                                />
                                {quickAddForm.formState.errors.name && (
                                  <p className="text-xs text-red-500 mt-1">{quickAddForm.formState.errors.name.message}</p>
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-medium">Đơn vị *</label>
                                <Input
                                  placeholder="kg, lít, hộp..."
                                  value={quickAddForm.watch("unit") || ""}
                                  onChange={(e) => quickAddForm.setValue("unit", e.target.value)}
                                  className="h-8 mt-1"
                                />
                                {quickAddForm.formState.errors.unit && (
                                  <p className="text-xs text-red-500 mt-1">{quickAddForm.formState.errors.unit.message}</p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="text-xs font-medium">Giá thành *</label>
                                <Input
                                  placeholder="0"
                                  value={quickAddForm.watch("unitPrice") ? formatInputAmount(quickAddForm.watch("unitPrice")) : ""}
                                  onChange={(e) => {
                                    const rawValue = parseInputAmount(e.target.value);
                                    quickAddForm.setValue("unitPrice", rawValue);
                                  }}
                                  className="h-8 mt-1"
                                />
                                {quickAddForm.formState.errors.unitPrice && (
                                  <p className="text-xs text-red-500 mt-1">{quickAddForm.formState.errors.unitPrice.message}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={isCreatingProduct}
                                onClick={() => {
                                  const formData = quickAddForm.getValues();
                                  quickAddForm.handleSubmit(handleCreateProduct)(formData as any);
                                }}
                                className="bg-tea-brown hover:bg-tea-brown/90 h-8"
                              >
                                {isCreatingProduct ? "Đang tạo..." : "Tạo & Chọn"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowQuickAdd(false);
                                  quickAddForm.reset();
                                }}
                                className="h-8"
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
                        className={hasStockError ? "border-red-500 focus:ring-red-500" : ""}
                      />
                    </FormControl>
                    {stockWarning && transactionType === "out" && (
                      <Alert className="mt-2 border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 text-sm">
                          {stockWarning}
                        </AlertDescription>
                      </Alert>
                    )}
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
                disabled={isPending || (transactionType === "out" && hasStockError)} 
                className="bg-tea-brown hover:bg-tea-brown/90"
              >
                {isPending 
                  ? "Đang xử lý..." 
                  : isEditMode 
                    ? "Cập nhật"
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