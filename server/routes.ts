import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertUserSchema, loginSchema, insertRevenueSchema, insertExpenseSchema, insertStockItemSchema, 
  insertStockTransactionSchema, insertAllocationAccountSchema, insertShareholderSchema, 
  insertExpenseCategorySchema, insertReserveAllocationSchema, insertReserveExpenditureSchema,
  insertBranchSchema, insertSystemSettingSchema
} from "@shared/schema";
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

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      // Redirect to login page after logout
      res.redirect("/");
    });
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
      const revenue = await storage.upsertRevenue(revenueData);
      res.json(revenue);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu doanh thu không hợp lệ" });
    }
  });

  app.get("/api/revenues/:year", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const revenues = await storage.getRevenuesByYear(year);
      res.json(revenues);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu doanh thu" });
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

  // Summary route must come before parameterized routes
  app.get("/api/expenses/summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getExpenseSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy tổng quan chi phí" });
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

  app.put("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, updateData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Không thể cập nhật chi phí" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpense(id);
      res.json({ message: "Đã xóa chi phí" });
    } catch (error) {
      res.status(500).json({ message: "Không thể xóa chi phí" });
    }
  });

  // Route với path parameters year/month
  app.get("/api/expenses/:year", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      console.log(`API /api/expenses/${year} called`);
      const expenses = await storage.getExpenses(year);
      console.log(`Found ${expenses.length} expenses for year ${year}`);
      res.json(expenses);
    } catch (error) {
      console.error("Error getting expenses by year:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu chi phí" });
    }
  });

  app.get("/api/expenses/:year/:month", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const expenses = await storage.getExpenses(year, month);
      res.json(expenses);
    } catch (error) {
      console.error("Error getting expenses by year/month:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu chi phí" });
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

  // Reserve expenditure routes
  app.get("/api/reserve-expenditures", requireAuth, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const expenditures = await storage.getReserveExpenditures(year, month);
      res.json(expenditures);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu chi tiêu quỹ dự trữ" });
    }
  });

  app.post("/api/reserve-expenditures", requireAuth, async (req, res) => {
    try {
      const expenditureData = insertReserveExpenditureSchema.parse(req.body);
      const expenditure = await storage.createReserveExpenditure(expenditureData);
      res.json(expenditure);
    } catch (error) {
      res.status(400).json({ message: "Dữ liệu chi tiêu quỹ dự trữ không hợp lệ" });
    }
  });

  app.put("/api/reserve-expenditures/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertReserveExpenditureSchema.partial().parse(req.body);
      const expenditure = await storage.updateReserveExpenditure(id, updateData);
      res.json(expenditure);
    } catch (error) {
      res.status(400).json({ message: "Không thể cập nhật chi tiêu quỹ dự trữ" });
    }
  });

  app.delete("/api/reserve-expenditures/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReserveExpenditure(id);
      res.json({ message: "Đã xóa chi tiêu quỹ dự trữ" });
    } catch (error) {
      res.status(500).json({ message: "Không thể xóa chi tiêu quỹ dự trữ" });
    }
  });

  app.get("/api/reserve-expenditures/summary/:year", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const summary = await storage.getReserveExpendituresSummary(year);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy tổng quan chi tiêu quỹ dự trữ" });
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

  // System Settings APIs
  app.get("/api/settings/system", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error in getSystemSettings:", error);
      res.status(500).json({ message: "Lỗi khi lấy cài đặt hệ thống" });
    }
  });

  app.put("/api/settings/system/:key", requireAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await storage.upsertSystemSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Lỗi khi cập nhật cài đặt" });
    }
  });

  // Shareholders APIs
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

  app.put("/api/settings/shareholders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertShareholderSchema.partial().parse(req.body);
      const shareholder = await storage.updateShareholder(id, updateData);
      res.json(shareholder);
    } catch (error) {
      res.status(400).json({ message: "Lỗi khi cập nhật cổ đông" });
    }
  });

  app.delete("/api/settings/shareholders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShareholder(id);
      res.json({ message: "Xóa cổ đông thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa cổ đông" });
    }
  });

  // Allocation Accounts APIs
  app.put("/api/settings/allocation-accounts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertAllocationAccountSchema.partial().parse(req.body);
      const account = await storage.updateAllocationAccount(id, updateData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Lỗi khi cập nhật tài khoản phân bổ" });
    }
  });

  app.delete("/api/settings/allocation-accounts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAllocationAccount(id);
      res.json({ message: "Xóa tài khoản phân bổ thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa tài khoản phân bổ" });
    }
  });

  // Expense Categories APIs with update and delete
  app.put("/api/settings/expense-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertExpenseCategorySchema.partial().parse(req.body);
      const category = await storage.updateExpenseCategory(id, updateData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Lỗi khi cập nhật danh mục chi phí" });
    }
  });

  app.delete("/api/settings/expense-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpenseCategory(id);
      res.json({ message: "Xóa danh mục chi phí thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa danh mục chi phí" });
    }
  });

  // Branches APIs
  app.get("/api/settings/branches", requireAuth, async (req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách chi nhánh" });
    }
  });

  app.post("/api/settings/branches", requireAuth, async (req, res) => {
    try {
      console.log("Branch POST request body:", req.body);
      const branchData = insertBranchSchema.parse(req.body);
      console.log("Parsed branch data:", branchData);
      const branch = await storage.createBranch(branchData);
      console.log("Created branch:", branch);
      res.json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: `Lỗi: ${error.message}` });
      } else {
        res.status(400).json({ message: "Dữ liệu chi nhánh không hợp lệ" });
      }
    }
  });

  app.put("/api/settings/branches/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertBranchSchema.partial().parse(req.body);
      const branch = await storage.updateBranch(id, updateData);
      res.json(branch);
    } catch (error) {
      res.status(400).json({ message: "Lỗi khi cập nhật chi nhánh" });
    }
  });

  app.delete("/api/settings/branches/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBranch(id);
      res.json({ message: "Xóa chi nhánh thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa chi nhánh" });
    }
  });

  // Logo upload APIs
  app.post("/api/logo/upload-url", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting logo upload URL:", error);
      res.status(500).json({ message: "Lỗi khi tạo URL upload" });
    }
  });

  app.post("/api/logo/update", requireAuth, async (req, res) => {
    try {
      const { logoUrl } = req.body;
      const objectStorageService = new ObjectStorageService();
      const logoPath = objectStorageService.normalizeLogoPath(logoUrl);
      
      // Update logo in system settings
      await storage.upsertSystemSetting("logo", logoPath);
      
      res.json({ logoPath });
    } catch (error) {
      console.error("Error updating logo:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật logo" });
    }
  });

  // Public logo serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
