import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const revenues = pgTable("revenues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // staff_salary, ingredients, fixed, additional
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  status: text("status").notNull().default("spent"), // spent, draft
  notes: text("notes"),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reserveAllocations = pgTable("reserve_allocations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  accountType: text("account_type").notNull(), // reinvestment, depreciation, risk_reserve, staff_bonus, dividends, marketing
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reserveExpenditures = pgTable("reserve_expenditures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Tên khoản chi
  sourceType: text("source_type").notNull(), // reinvestment, depreciation, risk_reserve, staff_bonus
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(), // Số tiền chi
  expenditureDate: date("expenditure_date").notNull(), // Ngày chi
  notes: text("notes"), // Ghi chú
  createdAt: timestamp("created_at").defaultNow(),
});

export const allocationAccounts = pgTable("allocation_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const shareholders = pgTable("shareholders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const stockItems = pgTable("stock_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category"),
  unit: text("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 0 }).notNull(),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: uuid("item_id").references(() => stockItems.id).notNull(),
  type: text("type").notNull(), // in, out
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }),
  notes: text("notes"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("general_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  item: one(stockItems, {
    fields: [stockTransactions.itemId],
    references: [stockItems.id],
  }),
}));

export const stockItemsRelations = relations(stockItems, ({ many }) => ({
  transactions: many(stockTransactions),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueSchema = createInsertSchema(revenues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertReserveAllocationSchema = createInsertSchema(reserveAllocations).omit({
  id: true,
  createdAt: true,
});

export const insertReserveExpenditureSchema = createInsertSchema(reserveExpenditures).omit({
  id: true,
  createdAt: true,
});

export const insertAllocationAccountSchema = createInsertSchema(allocationAccounts).omit({
  id: true,
});

export const insertShareholderSchema = createInsertSchema(shareholders).omit({
  id: true,
});

export const insertStockItemSchema = createInsertSchema(stockItems).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Tên hàng hóa là bắt buộc"),
  unit: z.string().min(1, "Đơn vị là bắt buộc"),
  unitPrice: z.string().min(1, "Giá thành là bắt buộc"),
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Revenue = typeof revenues.$inferSelect;
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type ReserveAllocation = typeof reserveAllocations.$inferSelect;
export type InsertReserveAllocation = z.infer<typeof insertReserveAllocationSchema>;

export type ReserveExpenditure = typeof reserveExpenditures.$inferSelect;
export type InsertReserveExpenditure = z.infer<typeof insertReserveExpenditureSchema>;

export type AllocationAccount = typeof allocationAccounts.$inferSelect;
export type InsertAllocationAccount = z.infer<typeof insertAllocationAccountSchema>;

export type Shareholder = typeof shareholders.$inferSelect;
export type InsertShareholder = z.infer<typeof insertShareholderSchema>;

export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// Login schema
export const loginSchema = z.object({
  phone: z.string().min(1, "Số điện thoại không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

// Update InsertUser schema to include username
export const insertUserSchemaUpdated = insertUserSchema.extend({
  username: z.string().min(1, "Username không được để trống"),
});

export type LoginData = z.infer<typeof loginSchema>;
