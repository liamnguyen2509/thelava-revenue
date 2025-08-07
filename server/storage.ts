import { 
  users, revenues, expenses, reserveAllocations, reserveExpenditures, allocationAccounts, 
  shareholders, stockItems, stockTransactions, expenseCategories, branches, systemSettings,
  type User, type InsertUser, type Revenue, type InsertRevenue,
  type Expense, type InsertExpense, type ReserveAllocation, type InsertReserveAllocation,
  type ReserveExpenditure, type InsertReserveExpenditure,
  type AllocationAccount, type InsertAllocationAccount, type Shareholder, type InsertShareholder,
  type StockItem, type InsertStockItem, type StockTransaction, type InsertStockTransaction,
  type ExpenseCategory, type InsertExpenseCategory, type Branch, type InsertBranch,
  type SystemSetting, type InsertSystemSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

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
  updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  getExpenseSummary(): Promise<{ monthly: number }>;
  getStockItems(): Promise<StockItem[]>;
  createStockItem(insertStockItem: InsertStockItem): Promise<StockItem>;
  getStockTransactions(): Promise<StockTransaction[]>;
  createStockTransaction(insertStockTransaction: InsertStockTransaction): Promise<StockTransaction>;
  getAllocationAccounts(): Promise<AllocationAccount[]>;
  createAllocationAccount(insertAllocationAccount: InsertAllocationAccount): Promise<AllocationAccount>;
  getReserveAllocations(year: number, month?: number): Promise<ReserveAllocation[]>;
  createReserveAllocation(insertReserveAllocation: InsertReserveAllocation): Promise<ReserveAllocation>;
  getReserveAllocationsSummary(): Promise<{ total: number; byAccount: { [key: string]: number } }>;
  getReserveExpenditures(year?: number, month?: number): Promise<ReserveExpenditure[]>;
  createReserveExpenditure(insertReserveExpenditure: InsertReserveExpenditure): Promise<ReserveExpenditure>;
  deleteReserveExpenditure(id: string): Promise<void>;
  updateReserveExpenditure(id: string, updateData: Partial<InsertReserveExpenditure>): Promise<ReserveExpenditure>;
  getReserveExpendituresSummary(year: number): Promise<{
    totalExpended: number;
    byAccount: { [key: string]: number };
    monthlyExpenditure: { [month: number]: { [account: string]: number } };
  }>;
  getShareholders(): Promise<Shareholder[]>;
  createShareholder(insertShareholder: InsertShareholder): Promise<Shareholder>;
  updateShareholder(id: string, updateData: Partial<InsertShareholder>): Promise<Shareholder>;
  deleteShareholder(id: string): Promise<void>;
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  createExpenseCategory(insertExpenseCategory: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: string, updateData: Partial<InsertExpenseCategory>): Promise<ExpenseCategory>;
  deleteExpenseCategory(id: string): Promise<void>;
  updateAllocationAccount(id: string, updateData: Partial<InsertAllocationAccount>): Promise<AllocationAccount>;
  deleteAllocationAccount(id: string): Promise<void>;
  getBranches(): Promise<Branch[]>;
  createBranch(insertBranch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, updateData: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  upsertSystemSetting(key: string, value: string): Promise<SystemSetting>;
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
      .where(and(eq(revenues.year, currentYear), eq(revenues.month, currentMonth)));
    
    const annual = annualRevenues.reduce((sum: number, r: Revenue) => sum + parseFloat(r.amount), 0);
    const monthly = monthlyRevenues.reduce((sum: number, r: Revenue) => sum + parseFloat(r.amount), 0);
    
    return { annual, monthly };
  }

  async getExpenses(year: number, month?: number): Promise<Expense[]> {
    if (month) {
      return await db.select().from(expenses)
        .where(and(eq(expenses.year, year), eq(expenses.month, month)));
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

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpenseSummary(): Promise<{ monthly: number }> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const monthlyExpenses = await db.select().from(expenses)
      .where(and(eq(expenses.year, currentYear), eq(expenses.month, currentMonth)));
    
    const monthly = monthlyExpenses.reduce((sum: number, e: Expense) => sum + parseFloat(e.amount), 0);
    
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

  async getReserveAllocations(year: number, month?: number): Promise<ReserveAllocation[]> {
    if (month) {
      return await db.select().from(reserveAllocations)
        .where(and(eq(reserveAllocations.year, year), eq(reserveAllocations.month, month)));
    }
    return await db.select().from(reserveAllocations).where(eq(reserveAllocations.year, year));
  }

  async createReserveAllocation(insertReserveAllocation: InsertReserveAllocation): Promise<ReserveAllocation> {
    const [allocation] = await db
      .insert(reserveAllocations)
      .values(insertReserveAllocation)
      .returning();
    return allocation;
  }

  async getReserveAllocationsSummary(): Promise<{ total: number; byAccount: { [key: string]: number } }> {
    const currentYear = new Date().getFullYear();
    const allocations = await this.getReserveAllocations(currentYear);
    
    const total = allocations.reduce((sum: number, allocation: ReserveAllocation) => 
      sum + parseFloat(allocation.amount.toString()), 0);
    
    const byAccount: { [key: string]: number } = {};
    allocations.forEach((allocation: ReserveAllocation) => {
      const accountType = allocation.accountType;
      byAccount[accountType] = (byAccount[accountType] || 0) + parseFloat(allocation.amount.toString());
    });
    
    return { total, byAccount };
  }

  // Reserve expenditure methods
  async getReserveExpenditures(year?: number, month?: number): Promise<ReserveExpenditure[]> {
    let query = db.select().from(reserveExpenditures);
    
    if (year && month) {
      query = query.where(
        and(
          sql`EXTRACT(YEAR FROM ${reserveExpenditures.expenditureDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${reserveExpenditures.expenditureDate}) = ${month}`
        )
      );
    } else if (year) {
      query = query.where(sql`EXTRACT(YEAR FROM ${reserveExpenditures.expenditureDate}) = ${year}`);
    }
    
    return await query.orderBy(desc(reserveExpenditures.expenditureDate));
  }

  async createReserveExpenditure(insertReserveExpenditure: InsertReserveExpenditure): Promise<ReserveExpenditure> {
    const [expenditure] = await db
      .insert(reserveExpenditures)
      .values(insertReserveExpenditure)
      .returning();
    return expenditure;
  }

  async deleteReserveExpenditure(id: string): Promise<void> {
    await db.delete(reserveExpenditures).where(eq(reserveExpenditures.id, id));
  }

  async updateReserveExpenditure(id: string, updateData: Partial<InsertReserveExpenditure>): Promise<ReserveExpenditure> {
    const [expenditure] = await db
      .update(reserveExpenditures)
      .set(updateData)
      .where(eq(reserveExpenditures.id, id))
      .returning();
    return expenditure;
  }

  async getReserveExpendituresSummary(year: number): Promise<{
    totalExpended: number;
    byAccount: { [key: string]: number };
    monthlyExpenditure: { [month: number]: { [account: string]: number } };
  }> {
    const expenditures = await this.getReserveExpenditures(year);
    
    const totalExpended = expenditures.reduce((sum, exp) => 
      sum + parseFloat(exp.amount.toString()), 0);
    
    const byAccount: { [key: string]: number } = {};
    const monthlyExpenditure: { [month: number]: { [account: string]: number } } = {};
    
    expenditures.forEach((exp) => {
      const sourceType = exp.sourceType;
      const month = new Date(exp.expenditureDate).getMonth() + 1;
      const amount = parseFloat(exp.amount.toString());
      
      // By account totals
      byAccount[sourceType] = (byAccount[sourceType] || 0) + amount;
      
      // Monthly breakdown
      if (!monthlyExpenditure[month]) {
        monthlyExpenditure[month] = {};
      }
      monthlyExpenditure[month][sourceType] = (monthlyExpenditure[month][sourceType] || 0) + amount;
    });
    
    return { totalExpended, byAccount, monthlyExpenditure };
  }

  async updateShareholder(id: string, updateData: Partial<InsertShareholder>): Promise<Shareholder> {
    const [shareholder] = await db
      .update(shareholders)
      .set(updateData)
      .where(eq(shareholders.id, id))
      .returning();
    return shareholder;
  }

  async deleteShareholder(id: string): Promise<void> {
    await db.delete(shareholders).where(eq(shareholders.id, id));
  }

  async updateExpenseCategory(id: string, updateData: Partial<InsertExpenseCategory>): Promise<ExpenseCategory> {
    const [category] = await db
      .update(expenseCategories)
      .set(updateData)
      .where(eq(expenseCategories.id, id))
      .returning();
    return category;
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
  }

  async updateAllocationAccount(id: string, updateData: Partial<InsertAllocationAccount>): Promise<AllocationAccount> {
    const [account] = await db
      .update(allocationAccounts)
      .set(updateData)
      .where(eq(allocationAccounts.id, id))
      .returning();
    return account;
  }

  async deleteAllocationAccount(id: string): Promise<void> {
    await db.delete(allocationAccounts).where(eq(allocationAccounts.id, id));
  }

  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.isActive, true));
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const [branch] = await db
      .insert(branches)
      .values(insertBranch)
      .returning();
    return branch;
  }

  async updateBranch(id: string, updateData: Partial<InsertBranch>): Promise<Branch> {
    const [branch] = await db
      .update(branches)
      .set(updateData)
      .where(eq(branches.id, id))
      .returning();
    return branch;
  }

  async deleteBranch(id: string): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async upsertSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }
      })
      .returning();
    return setting;
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