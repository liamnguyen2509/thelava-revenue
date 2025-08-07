/**
 * Custom hook for managing system settings consistently across components
 */

import { useQuery } from "@tanstack/react-query";
import type { SystemSetting } from "@shared/schema";
import { API_ENDPOINTS } from "@/lib/constants";

export function useSystemSettings() {
  const { data: systemSettings = [], isLoading, error } = useQuery<SystemSetting[]>({
    queryKey: [API_ENDPOINTS.SETTINGS.SYSTEM],
  });

  const getCurrency = (): string => {
    const currencySetting = systemSettings.find(s => s.key === "currency");
    return currencySetting?.value || "VNĐ";
  };

  const getLogo = (): string => {
    const logoSetting = systemSettings.find(s => s.key === "logo");
    return logoSetting?.value || "";
  };

  const getSetting = (key: string, defaultValue: string = ""): string => {
    const setting = systemSettings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  return {
    systemSettings,
    isLoading,
    error,
    getCurrency,
    getLogo,
    getSetting,
  };
}