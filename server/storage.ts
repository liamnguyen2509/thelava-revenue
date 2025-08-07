import { 
  users, revenues, expenses, reserveAllocations, reserveExpenditures, allocationAccounts, 
  shareholders, stockItems, stockTransactions, expenseCategories,
  type User, type InsertUser, type Revenue, type InsertRevenue,
  type Expense, type InsertExpense, type ReserveAllocation, type InsertReserveAllocation,
  type ReserveExpenditure, type InsertReserveExpenditure,
  type AllocationAccount, type InsertAllocationAccount, type Shareholder, type InsertShareholder,
  type StockItem, type InsertStockItem, type StockTransaction, type InsertStockTransaction,
  type ExpenseCategory, type InsertExpenseCategory
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