import { 
  users, revenues, expenses, reserveAllocations, allocationAccounts, 
  shareholders, stockItems, stockTransactions, expenseCategories,
  type User, type InsertUser, type Revenue, type InsertRevenue,
  type Expense, type InsertExpense, type ReserveAllocation, type InsertReserveAllocation,
  type AllocationAccount, type InsertAllocationAccount, type Shareholder, type InsertShareholder,
  type StockItem, type InsertStockItem, type StockTransaction, type InsertStockTransaction,
  type ExpenseCategory, type InsertExpenseCategory
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// IStorage Interface
interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getRevenuesByYear(year: number): Promise<Revenue[]>;
  createRevenue(insertRevenue: InsertRevenue): Promise<Revenue>;
  getRevenueSummary(): Promise<{ annual: number; monthly: number }>;
  getExpenses(year: number, month?: number): Promise<Expense[]>;
  createExpense(insertExpense: InsertExpense): Promise<Expense>;
  getExpenseSummary(): Promise<{ monthly: number }>;
  getStockItems(): Promise<StockItem[]>;
  createStockItem(insertStockItem: InsertStockItem): Promise<StockItem>;
  getStockTransactions(): Promise<StockTransaction[]>;
  createStockTransaction(insertStockTransaction: InsertStockTransaction): Promise<StockTransaction>;
  getAllocationAccounts(): Promise<AllocationAccount[]>;
  createAllocationAccount(insertAllocationAccount: InsertAllocationAccount): Promise<AllocationAccount>;
  getShareholders(): Promise<Shareholder[]>;
  createShareholder(insertShareholder: InsertShareholder): Promise<Shareholder>;
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  createExpenseCategory(insertExpenseCategory: InsertExpenseCategory): Promise<ExpenseCategory>;
  getDashboardData(): Promise<any>;
}

// rewrite MemStorage to DatabaseStorage
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getRevenuesByYear(year: number): Promise<Revenue[]> {
    return await db.select().from(revenues).where(eq(revenues.year, year));
  }

  async createRevenue(insertRevenue: InsertRevenue): Promise<Revenue> {
    const [revenue] = await db
      .insert(revenues)
      .values(insertRevenue)
      .returning();
    return revenue;
  }

  async getRevenueSummary(): Promise<{ annual: number; monthly: number }> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const annualRevenues = await db.select().from(revenues).where(eq(revenues.year, currentYear));
    const monthlyRevenues = await db.select().from(revenues)
      .where(eq(revenues.year, currentYear))
      .where(eq(revenues.month, currentMonth));
    
    const annual = annualRevenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const monthly = monthlyRevenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    return { annual, monthly };
  }

  async getExpenses(year: number, month?: number): Promise<Expense[]> {
    if (month) {
      return await db.select().from(expenses)
        .where(eq(expenses.year, year))
        .where(eq(expenses.month, month));
    }
    return await db.select().from(expenses).where(eq(expenses.year, year));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async getExpenseSummary(): Promise<{ monthly: number }> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const monthlyExpenses = await db.select().from(expenses)
      .where(eq(expenses.year, currentYear))
      .where(eq(expenses.month, currentMonth));
    
    const monthly = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    return { monthly };
  }

  async getStockItems(): Promise<StockItem[]> {
    return await db.select().from(stockItems).where(eq(stockItems.isActive, true));
  }

  async createStockItem(insertStockItem: InsertStockItem): Promise<StockItem> {
    const [item] = await db
      .insert(stockItems)
      .values(insertStockItem)
      .returning();
    return item;
  }

  async getStockTransactions(): Promise<StockTransaction[]> {
    return await db.select().from(stockTransactions);
  }

  async createStockTransaction(insertStockTransaction: InsertStockTransaction): Promise<StockTransaction> {
    const [transaction] = await db
      .insert(stockTransactions)
      .values(insertStockTransaction)
      .returning();
    return transaction;
  }

  async getAllocationAccounts(): Promise<AllocationAccount[]> {
    return await db.select().from(allocationAccounts).where(eq(allocationAccounts.isActive, true));
  }

  async createAllocationAccount(insertAllocationAccount: InsertAllocationAccount): Promise<AllocationAccount> {
    const [account] = await db
      .insert(allocationAccounts)
      .values(insertAllocationAccount)
      .returning();
    return account;
  }

  async getShareholders(): Promise<Shareholder[]> {
    return await db.select().from(shareholders).where(eq(shareholders.isActive, true));
  }

  async createShareholder(insertShareholder: InsertShareholder): Promise<Shareholder> {
    const [shareholder] = await db
      .insert(shareholders)
      .values(insertShareholder)
      .returning();
    return shareholder;
  }

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return await db.select().from(expenseCategories).where(eq(expenseCategories.isActive, true));
  }

  async createExpenseCategory(insertExpenseCategory: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [category] = await db
      .insert(expenseCategories)
      .values(insertExpenseCategory)
      .returning();
    return category;
  }

  async getDashboardData(): Promise<any> {
    const currentYear = new Date().getFullYear();
    const revenueData = await this.getRevenueSummary();
    const expenseData = await this.getExpenseSummary();
    
    return {
      revenue: revenueData,
      expenses: expenseData,
      year: currentYear
    };
  }
}

export const storage = new DatabaseStorage();