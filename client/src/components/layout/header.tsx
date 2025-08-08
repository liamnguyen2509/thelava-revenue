import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bell, Leaf, User, Menu } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
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
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden p-2 hover:bg-tea-cream"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5 text-tea-brown" />
          </Button>
          
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-tea-brown rounded-lg flex items-center justify-center">
            <Leaf className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-bold text-tea-brown">Lava Tea Shop</h1>
            <p className="text-xs text-gray-500">Hệ thống quản lý</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-bold text-tea-brown">Lava Tea</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="sm" className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-tea-cream">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-tea-light rounded-full flex items-center justify-center">
              <User className="text-white w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">Quản lý cửa hàng</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex hover:bg-tea-cream">
              Đăng xuất
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="sm:hidden px-2 py-1 text-xs hover:bg-tea-cream">
              Thoát
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
