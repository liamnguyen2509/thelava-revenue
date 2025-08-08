import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Coins,
  PiggyBank,
  Receipt,
  Package,
  ArrowDown,
  ArrowUp,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    title: "Tổng quan",
    href: "/",
    icon: BarChart3,
    isActive: true,
  },
];

const revenueItems = [
  {
    title: "Dòng tiền",
    href: "/cash-flow",
    icon: Coins,
  },
  {
    title: "Quỹ dự trữ",
    href: "/reserve-funds",
    icon: PiggyBank,
  },
  {
    title: "Chi phí hàng tháng",
    href: "/monthly-expenses",
    icon: Receipt,
  },
];

const inventoryItems = [
  {
    title: "Tổng quan kho",
    href: "/stock-overview",
    icon: Package,
  },
  {
    title: "Nhập kho",
    href: "/stock-in",
    icon: ArrowDown,
  },
  {
    title: "Xuất kho",
    href: "/stock-out",
    icon: ArrowUp,
  },
];

const settingsItems = [
  {
    title: "Cài đặt chung",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [location] = useLocation();

  const isActiveLink = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const renderMenuItem = (item: any, isSection = false) => (
    <li key={item.href}>
      <Link href={item.href}>
        <div
          className={cn(
            "flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors cursor-pointer touch-manipulation",
            isActiveLink(item.href)
              ? "bg-tea-brown text-white"
              : "text-gray-700 hover:bg-gray-100 active:bg-tea-cream"
          )}
          onClick={() => {
            // Close mobile sidebar when item is clicked
            if (window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
          }}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.title}</span>
        </div>
      </Link>
    </li>
  );

  return (
    <aside 
      className={cn(
        "fixed left-0 top-16 lg:top-20 bottom-0 w-64 bg-white shadow-lg lg:shadow-sm border-r border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out z-50 lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <nav className="p-4 pb-8">
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-between items-center mb-6 pb-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-tea-brown rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <h2 className="font-bold text-tea-brown">Menu</h2>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-tea-cream rounded-lg transition-colors"
          >
            <span className="sr-only">Đóng menu</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <ul className="space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
          
          <li className="pt-6 lg:pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-3 lg:pb-2">
              Quản lý doanh thu
            </p>
            <ul className="space-y-1">
              {revenueItems.map(item => renderMenuItem(item, true))}
            </ul>
          </li>
          
          <li className="pt-6 lg:pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-3 lg:pb-2">
              Quản lý kho hàng
            </p>
            <ul className="space-y-1">
              {inventoryItems.map(item => renderMenuItem(item, true))}
            </ul>
          </li>
          
          <li className="pt-6 lg:pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-3 lg:pb-2">
              Cài đặt
            </p>
            <ul className="space-y-1">
              {settingsItems.map(item => renderMenuItem(item, true))}
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
