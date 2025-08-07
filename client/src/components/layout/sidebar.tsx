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

export default function Sidebar() {
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
            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
            isActiveLink(item.href)
              ? "bg-tea-brown text-white"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.title}</span>
        </div>
      </Link>
    </li>
  );

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
          
          <li className="pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">
              Quản lý doanh thu
            </p>
            <ul className="space-y-1">
              {revenueItems.map(item => renderMenuItem(item, true))}
            </ul>
          </li>
          
          <li className="pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">
              Quản lý kho hàng
            </p>
            <ul className="space-y-1">
              {inventoryItems.map(item => renderMenuItem(item, true))}
            </ul>
          </li>
          
          <li className="pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">
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
