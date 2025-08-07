/**
 * Centralized API service for consistent backend communication
 */

import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

// Base service class for common CRUD operations
abstract class BaseApiService<T, CreateData, UpdateData> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getAll(): Promise<T[]> {
    const res = await fetch(this.endpoint);
    return res.json();
  }

  async getById(id: string): Promise<T> {
    const res = await fetch(`${this.endpoint}/${id}`);
    return res.json();
  }

  async create(data: CreateData): Promise<T> {
    const res = await apiRequest(this.endpoint, "POST", data);
    return res.json();
  }

  async update(id: string, data: UpdateData): Promise<T> {
    const res = await apiRequest(`${this.endpoint}/${id}`, "PUT", data);
    return res.json();
  }

  async delete(id: string): Promise<void> {
    await apiRequest(`${this.endpoint}/${id}`, "DELETE");
  }
}

// Expense service
export class ExpenseService extends BaseApiService<any, any, any> {
  constructor() {
    super(API_ENDPOINTS.EXPENSES);
  }

  async getSummary(month: number, year: number) {
    const res = await fetch(`${this.endpoint}/summary/${year}/${month}`);
    return res.json();
  }

  async getByFilters(filters: { month?: number; year?: number; category?: string }) {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.category) params.append('category', filters.category);
    
    const res = await fetch(`${this.endpoint}?${params.toString()}`);
    return res.json();
  }
}

// Revenue service
export class RevenueService extends BaseApiService<any, any, any> {
  constructor() {
    super(API_ENDPOINTS.REVENUES);
  }

  async getSummary(month: number, year: number) {
    const res = await fetch(`${this.endpoint}/summary/${year}/${month}`);
    return res.json();
  }
}

// Reserve operations service
export class ReserveService {
  static async getAllocations() {
    const res = await fetch(API_ENDPOINTS.RESERVE_ALLOCATIONS);
    return res.json();
  }

  static async getAllocationsSummary() {
    const res = await fetch(`${API_ENDPOINTS.RESERVE_ALLOCATIONS}/summary`);
    return res.json();
  }

  static async getExpenditures() {
    const res = await fetch(API_ENDPOINTS.RESERVE_EXPENDITURES);
    return res.json();
  }

  static async getExpendituresSummary(year: number) {
    const res = await fetch(`${API_ENDPOINTS.RESERVE_EXPENDITURES}/summary/${year}`);
    return res.json();
  }

  static async createAllocation(data: any) {
    const res = await apiRequest(API_ENDPOINTS.RESERVE_ALLOCATIONS, "POST", data);
    return res.json();
  }

  static async createExpenditure(data: any) {
    const res = await apiRequest(API_ENDPOINTS.RESERVE_EXPENDITURES, "POST", data);
    return res.json();
  }

  static async updateExpenditure(id: string, data: any) {
    const res = await apiRequest(`${API_ENDPOINTS.RESERVE_EXPENDITURES}/${id}`, "PUT", data);
    return res.json();
  }

  static async deleteExpenditure(id: string) {
    await apiRequest(`${API_ENDPOINTS.RESERVE_EXPENDITURES}/${id}`, "DELETE");
  }
}

// Settings service
export class SettingsService {
  static async getSystemSettings() {
    const res = await fetch(API_ENDPOINTS.SETTINGS.SYSTEM);
    return res.json();
  }

  static async updateSystemSetting(key: string, value: string) {
    const res = await apiRequest(`${API_ENDPOINTS.SETTINGS.SYSTEM}/${key}`, "PUT", { value });
    return res.json();
  }

  static async getShareholders() {
    const res = await fetch(API_ENDPOINTS.SETTINGS.SHAREHOLDERS);
    return res.json();
  }

  static async getAllocationAccounts() {
    const res = await fetch(API_ENDPOINTS.SETTINGS.ALLOCATION_ACCOUNTS);
    return res.json();
  }

  static async getExpenseCategories() {
    const res = await fetch(API_ENDPOINTS.SETTINGS.EXPENSE_CATEGORIES);
    return res.json();
  }

  static async getBranches() {
    const res = await fetch(API_ENDPOINTS.SETTINGS.BRANCHES);
    return res.json();
  }
}

// Authentication service
export class AuthService {
  static async getCurrentUser() {
    const res = await fetch(API_ENDPOINTS.AUTH.ME);
    return res.json();
  }

  static async login(credentials: { phone: string; password: string }) {
    const res = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, "POST", credentials);
    return res.json();
  }

  static async logout() {
    await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, "POST");
  }
}

// Export service instances
export const expenseService = new ExpenseService();
export const revenueService = new RevenueService();