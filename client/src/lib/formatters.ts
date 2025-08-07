/**
 * Centralized formatting utilities for consistent data display
 */

export interface FormatOptions {
  currency?: string;
  locale?: string;
}

/**
 * Format currency with Vietnamese formatting (dots as thousands separators)
 */
export function formatCurrency(amount: number, options: FormatOptions = {}): string {
  const { currency = "VNĐ", locale = "vi-VN" } = options;
  return Math.round(amount).toLocaleString(locale).replace(/,/g, '.') + " " + currency;
}

/**
 * Format date to Vietnamese format (dd/mm/yyyy)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format amount for display in input fields (with dots)
 */
export function formatAmountForDisplay(amount: string): string {
  const numericValue = amount.replace(/\D/g, '');
  if (!numericValue || numericValue === '0') return '';
  return parseInt(numericValue).toLocaleString('vi-VN').replace(/,/g, '.');
}

/**
 * Parse formatted amount back to numeric string
 */
export function parseAmountFromDisplay(displayAmount: string): string {
  const numericValue = displayAmount.replace(/\D/g, '');
  return numericValue || '0';
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Validate Vietnamese phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(0[3-9])[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Generate date range for filters
 */
export function generateYearOptions(startYear?: number, count: number = 5): number[] {
  const currentYear = new Date().getFullYear();
  const start = startYear || currentYear;
  return Array.from({ length: count }, (_, i) => start - i);
}

/**
 * Generate month options for Vietnamese interface
 */
export function generateMonthOptions(): Array<{ value: number; label: string }> {
  return [
    { value: 1, label: "Tháng 1" }, { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" }, { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" }, { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" }, { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" }, { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" }, { value: 12, label: "Tháng 12" }
  ];
}