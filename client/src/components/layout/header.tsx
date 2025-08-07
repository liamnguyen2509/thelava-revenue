import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bell, Leaf, User } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
    } catch (error) {
      toast({
        title: "Lỗi đăng xuất",
        description: "Có lỗi xảy ra khi đăng xuất",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-tea-brown rounded-lg flex items-center justify-center">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-tea-brown">Lava Tea Shop</h1>
            <p className="text-xs text-gray-500">Hệ thống quản lý</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-tea-light rounded-full flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">Quản lý cửa hàng</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
