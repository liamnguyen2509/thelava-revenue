/**
 * Centralized validation utilities for consistent form validation
 */

import { z } from "zod";
import { VALIDATION_RULES } from "@/lib/constants";
import { isValidPhoneNumber } from "@/lib/formatters";

// Common validation schemas
export const amountSchema = z
  .string()
  .min(1, VALIDATION_RULES.REQUIRED_FIELD)
  .refine((val) => {
    const num = parseFloat(val.replace(/\./g, ""));
    return !isNaN(num) && num > 0;
  }, VALIDATION_RULES.MIN_AMOUNT);

export const phoneSchema = z
  .string()
  .min(1, VALIDATION_RULES.REQUIRED_FIELD)
  .refine(isValidPhoneNumber, VALIDATION_RULES.INVALID_PHONE);

export const emailSchema = z
  .string()
  .min(1, VALIDATION_RULES.REQUIRED_FIELD)
  .email(VALIDATION_RULES.INVALID_EMAIL);

export const percentageSchema = z
  .number()
  .min(0, "Tỷ lệ không được nhỏ hơn 0")
  .max(100, VALIDATION_RULES.MAX_PERCENTAGE);

export const requiredStringSchema = z
  .string()
  .min(1, VALIDATION_RULES.REQUIRED_FIELD);

export const dateSchema = z
  .string()
  .min(1, VALIDATION_RULES.REQUIRED_FIELD);

// Expense form validation schema
export const expenseFormSchema = z.object({
  name: requiredStringSchema,
  category: requiredStringSchema,
  amount: amountSchema,
  expenseDate: dateSchema,
  status: z.enum(["spent", "draft"]),
  notes: z.string().optional(),
});

// Settings form validation schemas
export const shareholderFormSchema = z.object({
  name: requiredStringSchema.max(100, VALIDATION_RULES.MAX_LENGTH(100)),
  percentage: percentageSchema,
});

export const branchFormSchema = z.object({
  name: requiredStringSchema.max(100, VALIDATION_RULES.MAX_LENGTH(100)),
  address: requiredStringSchema.max(255, VALIDATION_RULES.MAX_LENGTH(255)),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return isValidPhoneNumber(val);
  }, VALIDATION_RULES.INVALID_PHONE),
});

export const expenseCategoryFormSchema = z.object({
  name: requiredStringSchema.max(100, VALIDATION_RULES.MAX_LENGTH(100)),
  code: requiredStringSchema
    .max(20, VALIDATION_RULES.MAX_LENGTH(20))
    .regex(/^[A-Z_]+$/, "Mã danh mục chỉ được chứa chữ in hoa và dấu gạch dưới"),
});

export const allocationAccountFormSchema = z.object({
  name: requiredStringSchema.max(100, VALIDATION_RULES.MAX_LENGTH(100)),
  code: requiredStringSchema
    .max(20, VALIDATION_RULES.MAX_LENGTH(20))
    .regex(/^[A-Z_]+$/, "Mã tài khoản chỉ được chứa chữ in hoa và dấu gạch dưới"),
});

// Reserve operations validation schemas
export const reserveAllocationFormSchema = z.object({
  accountId: requiredStringSchema,
  amount: amountSchema,
  allocationDate: dateSchema,
  notes: z.string().optional(),
});

export const reserveExpenditureFormSchema = z.object({
  name: requiredStringSchema,
  accountId: requiredStringSchema,
  amount: amountSchema,
  expenditureDate: dateSchema,
  notes: z.string().optional(),
});

// Revenue form validation schema  
export const revenueFormSchema = z.object({
  source: requiredStringSchema,
  amount: amountSchema,
  revenueDate: dateSchema,
  notes: z.string().optional(),
});

// Authentication validation schemas
export const loginFormSchema = z.object({
  phone: phoneSchema,
  password: z
    .string()
    .min(1, VALIDATION_RULES.REQUIRED_FIELD)
    .min(6, VALIDATION_RULES.MIN_LENGTH(6)),
});

// Stock management validation schemas
export const stockItemFormSchema = z.object({
  name: requiredStringSchema.max(100, VALIDATION_RULES.MAX_LENGTH(100)),
  code: requiredStringSchema
    .max(50, VALIDATION_RULES.MAX_LENGTH(50))
    .regex(/^[A-Za-z0-9_-]+$/, "Mã sản phẩm chỉ được chứa chữ, số và dấu gạch"),
  unit: requiredStringSchema.max(20, VALIDATION_RULES.MAX_LENGTH(20)),
  minQuantity: z
    .number()
    .min(0, "Số lượng tối thiểu không được nhỏ hơn 0")
    .optional(),
});

export const stockTransactionFormSchema = z.object({
  itemId: requiredStringSchema,
  type: z.enum(["in", "out"]),
  quantity: z
    .number()
    .min(1, "Số lượng phải lớn hơn 0"),
  unitPrice: z
    .number()
    .min(0, "Giá đơn vị không được nhỏ hơn 0")
    .optional(),
  notes: z.string().optional(),
});