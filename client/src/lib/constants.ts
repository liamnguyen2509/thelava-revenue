/**
 * Application constants for consistency and maintainability
 */

// Status options for various entities
export const EXPENSE_STATUSES = [
  { value: "spent", label: "Đã chi" },
  { value: "draft", label: "Nháp" },
] as const;

export const STOCK_TRANSACTION_TYPES = [
  { value: "in", label: "Nhập kho" },
  { value: "out", label: "Xuất kho" },
] as const;

// Color schemes for different categories
export const SUMMARY_CARD_COLORS = {
  salary: "from-blue-50 to-blue-100 border-blue-200",
  materials: "from-green-50 to-green-100 border-green-200", 
  fixed: "from-purple-50 to-purple-100 border-purple-200",
  variable: "from-orange-50 to-orange-100 border-orange-200",
  total: "from-tea-light to-tea-cream border-tea-brown",
} as const;

export const TEXT_COLORS = {
  salary: { title: "text-blue-800", amount: "text-blue-900", subtitle: "text-blue-600" },
  materials: { title: "text-green-800", amount: "text-green-900", subtitle: "text-green-600" },
  fixed: { title: "text-purple-800", amount: "text-purple-900", subtitle: "text-purple-600" },
  variable: { title: "text-orange-800", amount: "text-orange-900", subtitle: "text-orange-600" },
  total: { title: "text-tea-brown", amount: "text-tea-brown", subtitle: "text-tea-brown/70" },
} as const;

// Default form values
export const DEFAULT_EXPENSE_FORM = {
  name: "",
  category: "",
  amount: "0",
  expenseDate: new Date().toISOString().split('T')[0],
  status: "spent" as const,
  notes: "",
};

export const DEFAULT_SETTINGS_FORM = {
  logo: "",
  currency: "VNĐ",
};

// API endpoints for consistency
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    ME: "/api/auth/me",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
  },
  
  // Settings
  SETTINGS: {
    SYSTEM: "/api/settings/system",
    SHAREHOLDERS: "/api/settings/shareholders",
    ALLOCATION_ACCOUNTS: "/api/settings/allocation-accounts",
    EXPENSE_CATEGORIES: "/api/settings/expense-categories",
    BRANCHES: "/api/settings/branches",
  },
  
  // Business Data
  EXPENSES: "/api/expenses",
  REVENUES: "/api/revenues", 
  RESERVE_ALLOCATIONS: "/api/reserve-allocations",
  RESERVE_EXPENDITURES: "/api/reserve-expenditures",
  STOCK: {
    ITEMS: "/api/stock/items",
    TRANSACTIONS: "/api/stock/transactions",
  },
  
  // Dashboard
  DASHBOARD: "/api/dashboard",
} as const;

// Common validation rules
export const VALIDATION_RULES = {
  REQUIRED_FIELD: "Trường này là bắt buộc",
  INVALID_EMAIL: "Email không hợp lệ",
  INVALID_PHONE: "Số điện thoại không hợp lệ",
  MIN_AMOUNT: "Số tiền phải lớn hơn 0",
  MAX_PERCENTAGE: "Tỷ lệ không được vượt quá 100%",
  MIN_LENGTH: (min: number) => `Tối thiểu ${min} ký tự`,
  MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự`,
} as const;

// Common toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    CREATE: "Thêm thành công",
    UPDATE: "Cập nhật thành công", 
    DELETE: "Xóa thành công",
    SAVE: "Lưu thành công",
  },
  ERROR: {
    CREATE: "Có lỗi xảy ra khi thêm",
    UPDATE: "Có lỗi xảy ra khi cập nhật",
    DELETE: "Có lỗi xảy ra khi xóa",
    NETWORK: "Lỗi kết nối mạng",
    UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này",
  },
} as const;