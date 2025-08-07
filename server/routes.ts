import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertRevenueSchema, insertExpenseSchema, insertStockItemSchema, insertStockTransactionSchema, insertAllocationAccountSchema, insertShareholderSchema, insertExpenseCategorySchema, insertReserveAllocationSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import { Pool } from "@neondatabase/serverless";
import connectPgSimple from "connect-pg-simple";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const PgSession = connectPgSimple(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'lava-tea-shop-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(phone);
      if (!user) {
        return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
      }

      (req.session as any).userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Không thể đăng xuất" });
      }
      res.json({ message: "Đăng xuất thành công" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server" });
    }
  });

  // Revenue routes
  app.get("/api/revenues", requireAuth, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const revenues = await storage.getRevenuesByYear(year);
      res.json(revenues);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu doanh thu" });
    }
  });

  app.post("/api/revenues", requireAuth, async (req, res) => {
    try {
      const revenueData = insertRevenueSchema.parse(req.body);
      const revenue = await storage.createRevenue(revenueData);
      res.json(revenue);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu doanh thu không hợp lệ" });
    }
  });

  app.get("/api/revenues/summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getRevenueSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy tổng quan doanh thu" });
    }
  });

  // Expense routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const expenses = await storage.getExpenses(year, month);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu chi phí" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu chi phí không hợp lệ" });
    }
  });

  app.get("/api/expenses/summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getExpenseSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy tổng quan chi phí" });
    }
  });

  // Stock routes
  app.get("/api/stock/items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách hàng hóa" });
    }
  });

  app.post("/api/stock/items", requireAuth, async (req, res) => {
    try {
      const itemData = insertStockItemSchema.parse(req.body);
      const item = await storage.createStockItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu hàng hóa không hợp lệ" });
    }
  });

  app.get("/api/stock/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getStockTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy lịch sử giao dịch kho" });
    }
  });

  app.post("/api/stock/transactions", requireAuth, async (req, res) => {
    try {
      const transactionData = insertStockTransactionSchema.parse(req.body);
      const transaction = await storage.createStockTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu giao dịch không hợp lệ" });
    }
  });

  // Reserve allocation routes
  app.get("/api/reserve-allocations", requireAuth, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const allocations = await storage.getReserveAllocations(year, month);
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu phân bổ quỹ dự trữ" });
    }
  });

  app.post("/api/reserve-allocations", requireAuth, async (req, res) => {
    try {
      const allocationData = insertReserveAllocationSchema.parse(req.body);
      const allocation = await storage.createReserveAllocation(allocationData);
      res.json(allocation);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu phân bổ quỹ dự trữ không hợp lệ" });
    }
  });

  app.get("/api/reserve-allocations/summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getReserveAllocationsSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy tổng quan phân bổ quỹ dự trữ" });
    }
  });

  // Settings routes
  app.get("/api/settings/allocation-accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getAllocationAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy tài khoản phân bổ" });
    }
  });

  app.post("/api/settings/allocation-accounts", requireAuth, async (req, res) => {
    try {
      const accountData = insertAllocationAccountSchema.parse(req.body);
      const account = await storage.createAllocationAccount(accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu tài khoản phân bổ không hợp lệ" });
    }
  });

  app.get("/api/settings/shareholders", requireAuth, async (req, res) => {
    try {
      const shareholders = await storage.getShareholders();
      res.json(shareholders);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách cổ đông" });
    }
  });

  app.post("/api/settings/shareholders", requireAuth, async (req, res) => {
    try {
      const shareholderData = insertShareholderSchema.parse(req.body);
      const shareholder = await storage.createShareholder(shareholderData);
      res.json(shareholder);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu cổ đông không hợp lệ" });
    }
  });

  app.get("/api/settings/expense-categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh mục chi phí" });
    }
  });

  app.post("/api/settings/expense-categories", requireAuth, async (req, res) => {
    try {
      const categoryData = insertExpenseCategorySchema.parse(req.body);
      const category = await storage.createExpenseCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu danh mục chi phí không hợp lệ" });
    }
  });

  // Dashboard data
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const dashboard = await storage.getDashboardData();
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu dashboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
