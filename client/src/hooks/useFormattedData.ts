/**
 * Custom hook for consistent data formatting across components
 */

import { formatCurrency, formatDate, formatAmountForDisplay, parseAmountFromDisplay } from "@/lib/formatters";
import { useSystemSettings } from "./useSystemSettings";

export function useFormattedData() {
  const { getCurrency } = useSystemSettings();

  const formatMoney = (amount: number): string => {
    return formatCurrency(amount, { currency: getCurrency() });
  };

  const formatDisplayDate = (dateString: string): string => {
    return formatDate(dateString);
  };

  const formatInputAmount = (amount: string): string => {
    return formatAmountForDisplay(amount);
  };

  const parseInputAmount = (displayAmount: string): string => {
    return parseAmountFromDisplay(displayAmount);
  };

  const handleAmountInput = (value: string, setValue: (amount: string) => void): void => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const rawValue = parseInputAmount(cleaned);
    setValue(rawValue);
  };

  return {
    formatMoney,
    formatDisplayDate,
    formatInputAmount,
    parseInputAmount,
    handleAmountInput,
    currency: getCurrency(),
  };
}