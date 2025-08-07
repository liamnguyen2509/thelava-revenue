/**
 * Centralized error handling utilities
 */

import { ApiError, ValidationError } from "@/types/common";
import { TOAST_MESSAGES } from "@/lib/constants";

export class AppError extends Error {
  public code?: string;
  public details?: ValidationError[];
  public statusCode?: number;

  constructor(message: string, code?: string, details?: ValidationError[], statusCode?: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

export function parseApiError(error: any): ApiError {
  if (error instanceof Response) {
    return {
      message: error.statusText || TOAST_MESSAGES.ERROR.NETWORK,
      code: error.status.toString(),
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || TOAST_MESSAGES.ERROR.NETWORK,
      code: "CLIENT_ERROR",
      timestamp: new Date().toISOString(),
    };
  }

  if (typeof error === "object" && error !== null) {
    return {
      message: error.message || TOAST_MESSAGES.ERROR.NETWORK,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    message: TOAST_MESSAGES.ERROR.NETWORK,
    code: "UNKNOWN_ERROR",
    timestamp: new Date().toISOString(),
  };
}

export function getErrorMessage(error: any): string {
  const apiError = parseApiError(error);
  
  if (apiError.details && apiError.details.length > 0) {
    return apiError.details[0].message;
  }

  return apiError.message;
}

export function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.message.includes("fetch")) ||
    (error.code && error.code.includes("NETWORK"))
  );
}

export function isValidationError(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.code === "VALIDATION_ERROR" || (apiError.details && apiError.details.length > 0);
}

export function isUnauthorizedError(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.code === "401" || apiError.message.includes("Unauthorized");
}

export function isForbiddenError(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.code === "403" || apiError.message.includes("Forbidden");
}

export function handleCommonErrors(error: any): string | null {
  if (isUnauthorizedError(error)) {
    // Redirect to login
    window.location.href = "/login";
    return TOAST_MESSAGES.ERROR.UNAUTHORIZED;
  }

  if (isNetworkError(error)) {
    return TOAST_MESSAGES.ERROR.NETWORK;
  }

  if (isValidationError(error)) {
    return getErrorMessage(error);
  }

  return null;
}

// Error logging utility
export function logError(error: any, context?: string) {
  const apiError = parseApiError(error);
  
  console.error(`[${context || "APP_ERROR"}]`, {
    message: apiError.message,
    code: apiError.code,
    details: apiError.details,
    timestamp: apiError.timestamp,
    stack: error instanceof Error ? error.stack : undefined,
  });
}

// Retry utility for network operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      if (!isNetworkError(error)) throw error;
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw new Error("Max retries exceeded");
}