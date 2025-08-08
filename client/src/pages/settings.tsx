import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Upload, Edit, Trash2, Plus, Save, Building, Users, DollarSign, Tags, PieChart } from "lucide-react";
import type { SystemSetting, Shareholder, AllocationAccount, ExpenseCategory, Branch } from "@shared/schema";
import { LogoUploader } from "@/components/LogoUploader";

interface SettingsForm {
  logo: string;
  currency: string;
}

interface ShareholderForm {
  name: string;
  percentage: string;
}

interface AllocationAccountForm {
  name: string;
  description: string;
  percentage: string;
}

interface ExpenseCategoryForm {
  name: string;
  code: string;
}

interface BranchForm {
  name: string;
  address: string;
  phone: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for various forms and modals
  const [settingsForm, setSettingsForm] = useState<SettingsForm>({ logo: "", currency: "VNĐ" });
  const [shareholderForm, setShareholderForm] = useState<ShareholderForm>({ name: "", percentage: "" });
  const [allocationForm, setAllocationForm] = useState<AllocationAccountForm>({ name: "", description: "", percentage: "" });
  const [categoryForm, setCategoryForm] = useState<ExpenseCategoryForm>({ name: "", code: "" });
  const [branchForm, setBranchForm] = useState<BranchForm>({ name: "", address: "", phone: "" });
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // Fetch system settings
  const { data: systemSettings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings/system"],
  });

  // Fetch shareholders
  const { data: shareholders = [] } = useQuery<Shareholder[]>({
    queryKey: ["/api/settings/shareholders"],
  });

  // Fetch allocation accounts
  const { data: allocationAccounts = [] } = useQuery<AllocationAccount[]>({
    queryKey: ["/api/settings/allocation-accounts"],
  });

  // Fetch expense categories
  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/settings/expense-categories"],
  });

  // Fetch branches
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/settings/branches"],
  });

  // Initialize settings form
  useEffect(() => {
    if (systemSettings.length > 0) {
      const logoSetting = systemSettings.find(s => s.key === "logo");
      const currencySetting = systemSettings.find(s => s.key === "currency");
      
      setSettingsForm({
        logo: logoSetting?.value || "",
        currency: currencySetting?.value || "VNĐ"
      });
    }
  }, [systemSettings]);

  // Mutations
  const updateSystemSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest(`/api/settings/system/${key}`, "PUT", { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({ title: "Thành công", description: "Cập nhật cài đặt thành công" });
    }
  });

  const createShareholderMutation = useMutation({
    mutationFn: async (data: { name: string; percentage: number }) => {
      return await apiRequest("/api/settings/shareholders", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shareholders"] });
      setShareholderForm({ name: "", percentage: "" });
      setShowModal(false);
      toast({ title: "Thành công", description: "Thêm cổ đông thành công" });
    }
  });

  const updateShareholderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; percentage: number } }) => {
      return await apiRequest(`/api/settings/shareholders/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shareholders"] });
      setEditingItem(null);
      setShowModal(false);
      toast({ title: "Thành công", description: "Cập nhật cổ đông thành công" });
    }
  });

  const deleteShareholderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/settings/shareholders/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shareholders"] });
      toast({ title: "Thành công", description: "Xóa cổ đông thành công" });
    }
  });

  const createAllocationAccountMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; percentage: number }) => {
      return await apiRequest("/api/settings/allocation-accounts", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/allocation-accounts"] });
      setAllocationForm({ name: "", description: "", percentage: "" });
      setShowModal(false);
      toast({ title: "Thành công", description: "Thêm tài khoản phân bổ thành công" });
    }
  });

  const updateAllocationAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description: string; percentage: number } }) => {
      return await apiRequest(`/api/settings/allocation-accounts/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/allocation-accounts"] });
      setEditingItem(null);
      setShowModal(false);
      toast({ title: "Thành công", description: "Cập nhật tài khoản phân bổ thành công" });
    }
  });

  const deleteAllocationAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/settings/allocation-accounts/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/allocation-accounts"] });
      toast({ title: "Thành công", description: "Xóa tài khoản phân bổ thành công" });
    }
  });

  const createExpenseCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      return await apiRequest("/api/settings/expense-categories", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/expense-categories"] });
      setCategoryForm({ name: "", code: "" });
      setShowModal(false);
      toast({ title: "Thành công", description: "Thêm danh mục chi phí thành công" });
    }
  });

  const updateExpenseCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code: string } }) => {
      return await apiRequest(`/api/settings/expense-categories/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/expense-categories"] });
      setEditingItem(null);
      setShowModal(false);
      toast({ title: "Thành công", description: "Cập nhật danh mục chi phí thành công" });
    }
  });

  const deleteExpenseCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/settings/expense-categories/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/expense-categories"] });
      toast({ title: "Thành công", description: "Xóa danh mục chi phí thành công" });
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: { name: string; address: string; phone?: string }) => {
      console.log("Creating branch with data:", data);
      return await apiRequest("/api/settings/branches", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/branches"] });
      setBranchForm({ name: "", address: "", phone: "" });
      setShowModal(false);
      toast({ title: "Thành công", description: "Thêm chi nhánh thành công" });
    },
    onError: (error: any) => {
      console.error("Error creating branch:", error);
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể thêm chi nhánh", 
        variant: "destructive" 
      });
    }
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; address: string; phone?: string } }) => {
      return await apiRequest(`/api/settings/branches/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/branches"] });
      setEditingItem(null);
      setShowModal(false);
      toast({ title: "Thành công", description: "Cập nhật chi nhánh thành công" });
    }
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/settings/branches/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/branches"] });
      toast({ title: "Thành công", description: "Xóa chi nhánh thành công" });
    }
  });

  // Handler functions
  const handleSaveSystemSettings = async () => {
    try {
      await updateSystemSettingMutation.mutateAsync({ key: "logo", value: settingsForm.logo });
      await updateSystemSettingMutation.mutateAsync({ key: "currency", value: settingsForm.currency });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật cài đặt", variant: "destructive" });
    }
  };

  const handleSubmitForm = () => {
    if (editType === "shareholder") {
      const data = {
        name: shareholderForm.name,
        percentage: parseFloat(shareholderForm.percentage)
      };
      
      if (editingItem) {
        updateShareholderMutation.mutate({ id: editingItem.id, data });
      } else {
        createShareholderMutation.mutate(data);
      }
    } else if (editType === "allocation") {
      const data = {
        name: allocationForm.name,
        description: allocationForm.description,
        percentage: parseFloat(allocationForm.percentage)
      };
      
      if (editingItem) {
        updateAllocationAccountMutation.mutate({ id: editingItem.id, data });
      } else {
        createAllocationAccountMutation.mutate(data);
      }
    } else if (editType === "category") {
      const data = {
        name: categoryForm.name,
        code: categoryForm.code
      };
      
      if (editingItem) {
        updateExpenseCategoryMutation.mutate({ id: editingItem.id, data });
      } else {
        createExpenseCategoryMutation.mutate(data);
      }
    } else if (editType === "branch") {
      const data = {
        name: branchForm.name,
        address: branchForm.address,
        phone: branchForm.phone || undefined
      };
      
      if (editingItem) {
        updateBranchMutation.mutate({ id: editingItem.id, data });
      } else {
        createBranchMutation.mutate(data);
      }
    }
  };

  const openAddModal = (type: string) => {
    setEditType(type);
    setEditingItem(null);
    setShowModal(true);
    
    // Reset forms
    setShareholderForm({ name: "", percentage: "" });
    setAllocationForm({ name: "", description: "", percentage: "" });
    setCategoryForm({ name: "", code: "" });
    setBranchForm({ name: "", address: "", phone: "" });
  };

  const openEditModal = (type: string, item: any) => {
    setEditType(type);
    setEditingItem(item);
    setShowModal(true);
    
    if (type === "shareholder") {
      setShareholderForm({
        name: item.name,
        percentage: item.percentage.toString()
      });
    } else if (type === "allocation") {
      setAllocationForm({
        name: item.name,
        description: item.description || "",
        percentage: item.percentage.toString()
      });
    } else if (type === "category") {
      setCategoryForm({
        name: item.name,
        code: item.code
      });
    } else if (type === "branch") {
      setBranchForm({
        name: item.name,
        address: item.address,
        phone: item.phone || ""
      });
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + " " + (settingsForm.currency || "VNĐ");
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="p-4 sm:p-6 pb-0">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-tea-brown" />
          <h1 className="text-xl sm:text-2xl font-bold text-tea-brown">Cài đặt chung</h1>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-0">
        {/* Tab List */}
        <div className="px-4 sm:px-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
            <TabsTrigger value="general" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Chung</span>
              <span className="sm:hidden">Chung</span>
            </TabsTrigger>
            <TabsTrigger value="allocation" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Phân bổ quỹ</span>
              <span className="sm:hidden">Phân bổ</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Tags className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Danh mục chi phí</span>
              <span className="sm:hidden">Chi phí</span>
            </TabsTrigger>
            <TabsTrigger value="shareholders" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cổ đông</span>
              <span className="sm:hidden">Cổ đông</span>
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Building className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Chi nhánh</span>
              <span className="sm:hidden">Chi nhánh</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-6 pt-8 md:pt-6">
          <TabsContent value="general" className="mt-0">
            <Card>
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription>
                Quản lý logo và đơn vị tiền tệ của hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label>Logo hệ thống</Label>
                <LogoUploader 
                  currentLogo={settingsForm.logo}
                  onLogoUpdate={(logoPath) => {
                    setSettingsForm(prev => ({ ...prev, logo: logoPath }));
                  }}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Logo sẽ được hiển thị ở trang đăng nhập và thanh điều hướng
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                <Input
                  id="currency"
                  value={settingsForm.currency}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, currency: e.target.value }))}
                  placeholder="VNĐ"
                  className="w-full sm:w-32"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ký tự được hiển thị cùng với số tiền trong hệ thống
                </p>
              </div>

              <Button onClick={handleSaveSystemSettings} className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Lưu cài đặt
              </Button>
            </CardContent>
            </Card>
          </TabsContent>

          {/* Allocation Accounts */}
          <TabsContent value="allocation" className="mt-0">
            <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Tài khoản phân bổ quỹ dự trù</CardTitle>
                  <CardDescription className="text-sm">
                    Quản lý các loại tài khoản và tỷ lệ phân bổ cho quỹ dự trù
                  </CardDescription>
                </div>
                <Button onClick={() => openAddModal("allocation")} className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tài khoản
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allocationAccounts.map((account) => (
                  <div key={account.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium text-sm sm:text-base">{account.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{account.description}</p>
                      <p className="text-xs sm:text-sm font-medium">Tỷ lệ: {account.percentage}%</p>
                    </div>
                    <div className="flex gap-2 justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal("allocation", account)}
                        className="h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa tài khoản "{account.name}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAllocationAccountMutation.mutate(account.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Categories */}
          <TabsContent value="categories" className="mt-0">
            <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Danh mục chi phí</CardTitle>
                  <CardDescription className="text-sm">
                    Quản lý các loại chi phí hàng tháng
                  </CardDescription>
                </div>
                <Button onClick={() => openAddModal("category")} className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm danh mục
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium text-sm sm:text-base">{category.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Mã: {category.code}</p>
                    </div>
                    <div className="flex gap-2 justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal("category", category)}
                        className="h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa danh mục "{category.name}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteExpenseCategoryMutation.mutate(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </TabsContent>

          {/* Shareholders */}
          <TabsContent value="shareholders" className="mt-0">
            <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Cổ đông</CardTitle>
                  <CardDescription className="text-sm">
                    Quản lý danh sách cổ đông và tỷ lệ chia cổ tức
                  </CardDescription>
                </div>
                <Button onClick={() => openAddModal("shareholder")} className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm cổ đông
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shareholders.map((shareholder) => (
                  <div key={shareholder.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium text-sm sm:text-base">{shareholder.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Tỷ lệ: {shareholder.percentage}%</p>
                    </div>
                    <div className="flex gap-2 justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal("shareholder", shareholder)}
                        className="h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa cổ đông "{shareholder.name}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteShareholderMutation.mutate(shareholder.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </TabsContent>

          {/* Branches */}
          <TabsContent value="branches" className="mt-0">
            <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Chi nhánh</CardTitle>
                  <CardDescription className="text-sm">
                    Quản lý danh sách các chi nhánh của tiệm
                  </CardDescription>
                </div>
                <Button onClick={() => openAddModal("branch")} className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chi nhánh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium text-sm sm:text-base">{branch.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{branch.address}</p>
                      {branch.phone && (
                        <p className="text-xs sm:text-sm text-muted-foreground">SĐT: {branch.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal("branch", branch)}
                        className="h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa chi nhánh "{branch.name}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBranchMutation.mutate(branch.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal for Add/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Chỉnh sửa" : "Thêm mới"} {
                editType === "shareholder" ? "cổ đông" :
                editType === "allocation" ? "tài khoản phân bổ" :
                editType === "category" ? "danh mục chi phí" :
                editType === "branch" ? "chi nhánh" : ""
              }
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Cập nhật thông tin" : "Thêm thông tin mới cho"} {
                editType === "shareholder" ? "cổ đông" :
                editType === "allocation" ? "tài khoản phân bổ quỹ" :
                editType === "category" ? "danh mục chi phí" :
                editType === "branch" ? "chi nhánh" : ""
              }.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editType === "shareholder" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shareholder-name">Tên cổ đông</Label>
                  <Input
                    id="shareholder-name"
                    value={shareholderForm.name}
                    onChange={(e) => setShareholderForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên cổ đông"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shareholder-percentage">Tỷ lệ (%)</Label>
                  <Input
                    id="shareholder-percentage"
                    type="number"
                    value={shareholderForm.percentage}
                    onChange={(e) => setShareholderForm(prev => ({ ...prev, percentage: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </>
            )}

            {editType === "allocation" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="allocation-name">Tên tài khoản</Label>
                  <Input
                    id="allocation-name"
                    value={allocationForm.name}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên tài khoản"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocation-description">Mô tả</Label>
                  <Textarea
                    id="allocation-description"
                    value={allocationForm.description}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Nhập mô tả"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocation-percentage">Tỷ lệ phân bổ (%)</Label>
                  <Input
                    id="allocation-percentage"
                    type="number"
                    value={allocationForm.percentage}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, percentage: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </>
            )}

            {editType === "category" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category-name">Tên danh mục</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên danh mục"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-code">Mã danh mục</Label>
                  <Input
                    id="category-code"
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Nhập mã danh mục"
                  />
                </div>
              </>
            )}

            {editType === "branch" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Tên chi nhánh</Label>
                  <Input
                    id="branch-name"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên chi nhánh"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-address">Địa chỉ</Label>
                  <Textarea
                    id="branch-address"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Nhập địa chỉ chi nhánh"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-phone">Số điện thoại (tùy chọn)</Label>
                  <Input
                    id="branch-phone"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto order-2 sm:order-1">
              Hủy
            </Button>
            <Button onClick={handleSubmitForm} className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto order-1 sm:order-2">
              {editingItem ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}