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
import { eq, and, sql, desc, isNotNull } from "drizzle-orm";

// IStorage Interface
interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getRevenuesByYear(year: number): Promise<Revenue[]>;
  createRevenue(insertRevenue: InsertRevenue): Promise<Revenue>;
  upsertRevenue(insertRevenue: InsertRevenue): Promise<Revenue>;
  getRevenueSummary(): Promise<{ annual: number; monthly: number }>;
  getExpenses(year: number, month?: number): Promise<Expense[]>;
  createExpense(insertExpense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  getExpenseSummary(): Promise<{ monthly: number }>;
  getStockItems(): Promise<StockItem[]>;
  createStockItem(insertStockItem: InsertStockItem): Promise<StockItem>;
  updateStockItem(id: string, updateData: Partial<InsertStockItem>): Promise<StockItem>;
  deleteStockItem(id: string): Promise<void>;
  getStockTransactions(itemId?: string): Promise<StockTransaction[]>;
  createStockTransaction(insertStockTransaction: InsertStockTransaction): Promise<StockTransaction>;
  updateStockAfterTransaction(itemId: string, quantity: number, type: 'in' | 'out'): Promise<void>;
  getStockSummary(): Promise<{ totalItems: number; lowStockItems: number; totalValue: number }>;
  getStockTransactionSummary(itemId: string): Promise<{ totalIn: number; totalOut: number }>;
  getStockItemsWithTransactionSummary(): Promise<(StockItem & { totalIn: number; totalOut: number })[]>;
  getStockItemPriceHistory(itemId: string): Promise<Array<{ date: string; price: string; type: string; quantity: string; notes?: string }>>;
  updateStockTransaction(id: string, updateData: Partial<InsertStockTransaction>): Promise<StockTransaction>;
  deleteStockTransaction(id: string): Promise<void>;
  getStockTransaction(id: string): Promise<StockTransaction | undefined>;
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

  async upsertRevenue(insertRevenue: InsertRevenue): Promise<Revenue> {
    // First try to find existing revenue for the same month and year
    const existingRevenue = await db
      .select()
      .from(revenues)
      .where(and(eq(revenues.year, insertRevenue.year), eq(revenues.month, insertRevenue.month)))
      .limit(1);
    
    if (existingRevenue.length > 0) {
      // Update existing revenue
      const [revenue] = await db
        .update(revenues)
        .set(insertRevenue)
        .where(eq(revenues.id, existingRevenue[0].id))
        .returning();
      return revenue;
    } else {
      // Create new revenue
      const [revenue] = await db
        .insert(revenues)
        .values(insertRevenue)
        .returning();
      return revenue;
    }
  }

  async getRevenueSummary(): Promise<{ 
    annual: number; 
    monthly: number;
    annualGrowth: number;
    monthlyGrowth: number;
  }> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const lastYear = currentYear - 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    try {
      // Get current year data
      const annualRevenues = await db.select().from(revenues).where(eq(revenues.year, currentYear));
      const monthlyRevenues = await db.select().from(revenues)
        .where(and(eq(revenues.year, currentYear), eq(revenues.month, currentMonth)));
      
      // Get last year data for comparison
      const lastYearRevenues = await db.select().from(revenues).where(eq(revenues.year, lastYear));
      const lastMonthRevenues = await db.select().from(revenues)
        .where(and(eq(revenues.year, lastMonthYear), eq(revenues.month, lastMonth)));
      
      // Calculate current totals
      const annual = annualRevenues.reduce((sum: number, r: Revenue) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0);
      
      const monthly = monthlyRevenues.reduce((sum: number, r: Revenue) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0);
      
      // Calculate comparison totals
      const lastYearTotal = lastYearRevenues.reduce((sum: number, r: Revenue) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0);
      
      const lastMonthTotal = lastMonthRevenues.reduce((sum: number, r: Revenue) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0);
      
      // Calculate growth percentages
      const annualGrowth = lastYearTotal > 0 ? ((annual - lastYearTotal) / lastYearTotal) * 100 : 0;
      const monthlyGrowth = lastMonthTotal > 0 ? ((monthly - lastMonthTotal) / lastMonthTotal) * 100 : 0;
      
      console.log(`Revenue summary - Annual: ${annual}, Monthly: ${monthly}`);
      return { annual, monthly, annualGrowth, monthlyGrowth };
    } catch (error) {
      console.error('Error getting revenue summary:', error);
      return { annual: 0, monthly: 0, annualGrowth: 0, monthlyGrowth: 0 };
    }
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

  async getExpenseSummary(): Promise<{ monthly: number; monthlyGrowth: number }> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    try {
      // Get current month expenses
      const monthlyExpenses = await db.select().from(expenses)
        .where(and(eq(expenses.year, currentYear), eq(expenses.month, currentMonth)));
      
      // Get last month expenses for comparison
      const lastMonthExpenses = await db.select().from(expenses)
        .where(and(eq(expenses.year, lastMonthYear), eq(expenses.month, lastMonth)));
      
      const monthly = monthlyExpenses.reduce((sum: number, e: Expense) => {
        const amount = parseFloat(e.amount) || 0;
        return sum + amount;
      }, 0);
      
      const lastMonthTotal = lastMonthExpenses.reduce((sum: number, e: Expense) => {
        const amount = parseFloat(e.amount) || 0;
        return sum + amount;
      }, 0);
      
      // Calculate growth percentage
      const monthlyGrowth = lastMonthTotal > 0 ? ((monthly - lastMonthTotal) / lastMonthTotal) * 100 : 0;
      
      console.log(`Expense summary - Monthly: ${monthly}`);
      return { monthly, monthlyGrowth };
    } catch (error) {
      console.error('Error getting expense summary:', error);
      return { monthly: 0, monthlyGrowth: 0 };
    }
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

  async updateStockItem(id: string, updateData: Partial<InsertStockItem>): Promise<StockItem> {
    const [item] = await db
      .update(stockItems)
      .set(updateData)
      .where(eq(stockItems.id, id))
      .returning();
    return item;
  }

  async deleteStockItem(id: string): Promise<void> {
    await db
      .update(stockItems)
      .set({ isActive: false })
      .where(eq(stockItems.id, id));
  }

  async getStockTransactions(itemId?: string): Promise<StockTransaction[]> {
    if (itemId) {
      return await db.select().from(stockTransactions).where(eq(stockTransactions.itemId, itemId));
    }
    return await db.select().from(stockTransactions).orderBy(desc(stockTransactions.createdAt));
  }

  async createStockTransaction(insertStockTransaction: InsertStockTransaction): Promise<StockTransaction> {
    const [transaction] = await db
      .insert(stockTransactions)
      .values(insertStockTransaction)
      .returning();
    
    // Update stock levels after transaction
    if (transaction.itemId) {
      await this.updateStockAfterTransaction(
        transaction.itemId,
        parseFloat(transaction.quantity),
        transaction.type as 'in' | 'out'
      );
    }
    
    return transaction;
  }

  async updateStockAfterTransaction(itemId: string, quantity: number, type: 'in' | 'out'): Promise<void> {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, itemId));
    if (!item) return;

    const currentStock = parseFloat(item.currentStock);
    const newStock = type === 'in' ? currentStock + quantity : currentStock - quantity;
    
    await db
      .update(stockItems)
      .set({ currentStock: newStock.toString() })
      .where(eq(stockItems.id, itemId));
  }

  async getStockSummary(): Promise<{ totalItems: number; lowStockItems: number; totalValue: number }> {
    const items = await db.select().from(stockItems).where(eq(stockItems.isActive, true));
    
    const totalItems = items.length;
    const lowStockItems = items.filter(item => 
      parseFloat(item.currentStock) <= parseFloat(item.minStock)
    ).length;
    
    // Calculate total value using unit price from stock items
    const totalValue = items.reduce((total, item) => {
      if (item.unitPrice) {
        return total + (parseFloat(item.currentStock) * parseFloat(item.unitPrice));
      }
      return total;
    }, 0);
    
    return { totalItems, lowStockItems, totalValue };
  }

  async getStockTransactionSummary(itemId: string): Promise<{ totalIn: number; totalOut: number }> {
    const transactions = await db.select().from(stockTransactions).where(eq(stockTransactions.itemId, itemId));
    
    const totalIn = transactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    
    const totalOut = transactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    
    return { totalIn, totalOut };
  }

  async getStockItemsWithTransactionSummary(): Promise<(StockItem & { totalIn: number; totalOut: number })[]> {
    const items = await db.select().from(stockItems).where(eq(stockItems.isActive, true));
    
    const itemsWithSummary = await Promise.all(
      items.map(async (item) => {
        const summary = await this.getStockTransactionSummary(item.id);
        return {
          ...item,
          totalIn: summary.totalIn,
          totalOut: summary.totalOut
        };
      })
    );
    
    return itemsWithSummary;
  }

  async getStockItemPriceHistory(itemId: string): Promise<Array<{ date: string; price: string; type: string; quantity: string; notes?: string }>> {
    const transactions = await db
      .select({
        transactionDate: stockTransactions.transactionDate,
        unitPrice: stockTransactions.unitPrice,
        type: stockTransactions.type,
        quantity: stockTransactions.quantity,
        notes: stockTransactions.notes
      })
      .from(stockTransactions)
      .where(and(
        eq(stockTransactions.itemId, itemId),
        isNotNull(stockTransactions.unitPrice)
      ))
      .orderBy(desc(stockTransactions.transactionDate));

    return transactions.map(t => ({
      date: t.transactionDate,
      price: t.unitPrice || '0',
      type: t.type,
      quantity: t.quantity,
      notes: t.notes || undefined
    }));
  }

  async getStockTransaction(id: string): Promise<StockTransaction | undefined> {
    const [transaction] = await db.select().from(stockTransactions).where(eq(stockTransactions.id, id));
    return transaction || undefined;
  }

  async updateStockTransaction(id: string, updateData: Partial<InsertStockTransaction>): Promise<StockTransaction> {
    // Get the original transaction to calculate stock adjustment
    const originalTransaction = await this.getStockTransaction(id);
    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    // Update the transaction
    const [updatedTransaction] = await db
      .update(stockTransactions)
      .set(updateData)
      .where(eq(stockTransactions.id, id))
      .returning();

    // Recalculate stock levels if quantity or item changed
    if (updateData.quantity !== undefined || updateData.itemId !== undefined) {
      // Reverse the original transaction's effect
      const originalQuantity = parseFloat(originalTransaction.quantity);
      const reverseType = originalTransaction.type === 'in' ? 'out' : 'in';
      await this.updateStockAfterTransaction(
        originalTransaction.itemId,
        originalQuantity,
        reverseType as 'in' | 'out'
      );

      // Apply the new transaction's effect
      const newQuantity = updateData.quantity ? parseFloat(updateData.quantity) : originalQuantity;
      const newItemId = updateData.itemId || originalTransaction.itemId;
      await this.updateStockAfterTransaction(
        newItemId,
        newQuantity,
        updatedTransaction.type as 'in' | 'out'
      );
    }

    return updatedTransaction;
  }

  async deleteStockTransaction(id: string): Promise<void> {
    // Get the transaction to reverse its stock effect
    const transaction = await this.getStockTransaction(id);
    if (transaction) {
      // Reverse the transaction's effect on stock
      const quantity = parseFloat(transaction.quantity);
      const reverseType = transaction.type === 'in' ? 'out' : 'in';
      await this.updateStockAfterTransaction(
        transaction.itemId,
        quantity,
        reverseType as 'in' | 'out'
      );
    }

    // Delete the transaction
    await db.delete(stockTransactions).where(eq(stockTransactions.id, id));
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
      ) as any;
    } else if (year) {
      query = query.where(sql`EXTRACT(YEAR FROM ${reserveExpenditures.expenditureDate}) = ${year}`) as any;
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