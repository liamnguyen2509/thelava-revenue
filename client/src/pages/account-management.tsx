import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCog, Lock, User, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AccountManagement() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
    </div>
  );
}