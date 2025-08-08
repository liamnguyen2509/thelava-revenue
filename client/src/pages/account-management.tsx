import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Lock, User, Save, Plus, Users, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType } from "@shared/schema";

export default function AccountManagement() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // New user form
  const [newUserForm, setNewUserForm] = useState({
    phone: "",
    username: "",
    name: "",
    password: "",
    role: "admin"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all users
  const { data: allUsers = [] } = useQuery<(UserType & { password?: never })[]>({
    queryKey: ["/api/users"],
  });

  // Set display name from current user
  useState(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("/api/auth/profile", "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Thành công", description: "Cập nhật thông tin thành công" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("/api/auth/change-password", "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Thành công", description: "Đổi mật khẩu thành công" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({ name: displayName });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const createUserMutation = useMutation({
    mutationFn: async (data: { phone: string; username: string; name: string; password: string; role: string }) => {
      const res = await apiRequest("/api/users", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setNewUserForm({ phone: "", username: "", name: "", password: "", role: "admin" });
      setShowAddUserModal(false);
      toast({ title: "Thành công", description: "Tạo tài khoản thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài khoản",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUserForm.phone || !newUserForm.username || !newUserForm.name || !newUserForm.password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (newUserForm.password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(newUserForm);
  };

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 sm:h-6 sm:w-6 text-tea-brown" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={user?.phone || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Số điện thoại không thể thay đổi</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị"
              />
            </div>

            <Button 
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              className="bg-tea-brown hover:bg-tea-brown/90 w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Cập nhật thông tin
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
              />
            </div>

            <Button 
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="bg-tea-brown hover:bg-tea-brown/90 w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Đổi mật khẩu
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-gray-600">ID tài khoản:</p>
              <p className="font-mono text-xs bg-gray-50 p-2 rounded">{user?.id}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-gray-600">Ngày tạo:</p>
              <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách tài khoản
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Quản lý tất cả tài khoản người dùng trong hệ thống</p>
            </div>
            <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
              <DialogTrigger asChild>
                <Button className="bg-tea-brown hover:bg-tea-brown/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tài khoản
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Thêm tài khoản mới</DialogTitle>
                  <DialogDescription>
                    Tạo tài khoản người dùng mới cho hệ thống
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPhone">Số điện thoại</Label>
                    <Input
                      id="newPhone"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUsername">Tên đăng nhập</Label>
                    <Input
                      id="newUsername"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newName">Tên hiển thị</Label>
                    <Input
                      id="newName"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên hiển thị"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newRole">Vai trò</Label>
                    <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                        <SelectItem value="user">Người dùng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending}
                    className="bg-tea-brown hover:bg-tea-brown/90"
                  >
                    Tạo tài khoản
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Tên hiển thị</th>
                  <th className="text-left py-3 px-4 font-medium">Tên đăng nhập</th>
                  <th className="text-left py-3 px-4 font-medium">Số điện thoại</th>
                  <th className="text-left py-3 px-4 font-medium">Vai trò</th>
                  <th className="text-left py-3 px-4 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((userItem) => (
                  <tr key={userItem.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{userItem.name}</td>
                    <td className="py-3 px-4">{userItem.username}</td>
                    <td className="py-3 px-4">{userItem.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        userItem.role === 'admin' 
                          ? 'bg-tea-brown/10 text-tea-brown' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userItem.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{userItem.createdAt ? formatDate(userItem.createdAt) : 'Không rõ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {allUsers.map((userItem) => (
              <div key={userItem.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleRowExpansion(userItem.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{userItem.name}</div>
                    <div className="text-sm text-gray-600">{userItem.phone}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      userItem.role === 'admin' 
                        ? 'bg-tea-brown/10 text-tea-brown' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {userItem.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    {expandedRows.has(userItem.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {expandedRows.has(userItem.id) && (
                  <div className="px-4 pb-4 border-t bg-gray-50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên đăng nhập:</span>
                      <span>{userItem.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span>{userItem.createdAt ? formatDate(userItem.createdAt) : 'Không rõ'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {allUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Chưa có tài khoản nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}