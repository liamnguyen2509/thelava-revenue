/**
 * Common type definitions for better type safety and consistency
 */

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form state types
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Filter types
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface MonthYearFilter {
  month?: number;
  year?: number;
}

export interface PaginationFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Component props types
export interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
}

export interface CrudModalProps<T, CreateData, UpdateData> extends BaseModalProps {
  data?: T | null;
  onSave: (data: CreateData | UpdateData) => void;
  isLoading?: boolean;
}

// Summary and statistics types
export interface MonthlySummary {
  month: number;
  year: number;
  total: number;
  count: number;
  categories?: Record<string, number>;
}

export interface YearlySummary {
  year: number;
  total: number;
  months: MonthlySummary[];
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

// Status types
export type EntityStatus = "active" | "inactive" | "pending" | "archived";
export type TransactionType = "income" | "expense" | "transfer";
export type UserRole = "admin" | "manager" | "user";

// Error handling types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: ValidationError[];
  timestamp: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Table and list types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  disabled?: (item: T) => boolean;
}

// Dashboard types
export interface DashboardCard {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  color?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}