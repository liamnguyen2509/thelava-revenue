# Lava Tea Shop - Development Guide

## 🏗️ Architecture Overview

Hệ thống được xây dựng theo **Domain-Driven Design** với các pattern sau:

### Frontend (Client-Side)
```
client/src/
├── components/
│   ├── common/          # Reusable components
│   ├── modals/          # Modal dialogs
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utilities & configurations
├── pages/              # Route-based components
├── services/           # API service layers
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

### Backend (Server-Side)
```
server/
├── db.ts              # Database connection
├── storage.ts         # Data access layer (Repository pattern)
├── routes.ts          # Express routes (Controller layer)
└── index.ts           # Application entry point
```

### Shared
```
shared/
└── schema.ts          # Database schemas & type definitions
```

## 🎯 Design Patterns Implemented

### 1. Repository Pattern
- **File**: `server/storage.ts`
- **Purpose**: Abstract database operations
- **Usage**: All database interactions go through `IStorage` interface

### 2. MVC Pattern
- **Model**: Drizzle ORM schemas (`shared/schema.ts`)
- **View**: React components (`client/src/components/`, `client/src/pages/`)
- **Controller**: Express routes (`server/routes.ts`)

### 3. Service Layer Pattern
- **File**: `client/src/services/apiService.ts`
- **Purpose**: Centralize API communication logic
- **Benefits**: Consistent error handling, reusable API methods

### 4. Custom Hooks Pattern
- **Files**: `client/src/hooks/`
- **Purpose**: Reusable React logic
- **Examples**: `useSystemSettings`, `useFormattedData`, `useCrudOperations`

### 5. Component-Based Architecture
- **Principle**: Single Responsibility, Reusability
- **Structure**: Common components, specialized modals, page components

## 📋 Development Guidelines

### Adding New Features

#### 1. Database Changes
```bash
# 1. Update schema
# Edit: shared/schema.ts

# 2. Add to storage interface
# Edit: server/storage.ts (IStorage interface)

# 3. Implement storage methods
# Edit: server/storage.ts (DatabaseStorage class)

# 4. Push changes to database
npm run db:push
```

#### 2. API Endpoints
```typescript
// server/routes.ts
app.get("/api/new-endpoint", async (req, res) => {
  const data = await storage.getNewData();
  res.json(data);
});
```

#### 3. Frontend Components
```typescript
// client/src/pages/new-feature.tsx
import { useQuery } from "@tanstack/react-query";

export function NewFeature() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/new-endpoint"],
  });

  // Component logic...
}
```

### Code Style & Standards

#### 1. TypeScript
- Always use strong typing
- Leverage shared schema types
- Prefer interfaces over types for extensibility

#### 2. API Calls
```typescript
// ✅ Correct parameter order
await apiRequest("/api/endpoint", "POST", data);

// ❌ Wrong parameter order
await apiRequest("POST", "/api/endpoint", data);
```

#### 3. Error Handling
```typescript
// Use consistent error handling
import { handleCommonErrors, logError } from "@/utils/errorHandler";

try {
  // API call
} catch (error) {
  logError(error, "FeatureName");
  const message = handleCommonErrors(error) || "Default error message";
  toast({ title: "Lỗi", description: message, variant: "destructive" });
}
```

#### 4. Form Validation
```typescript
// Use centralized validation schemas
import { expenseFormSchema } from "@/utils/validation";

const form = useForm({
  resolver: zodResolver(expenseFormSchema),
  defaultValues: DEFAULT_EXPENSE_FORM,
});
```

## 🛠️ Utilities & Helpers

### Formatting
```typescript
import { formatCurrency, formatDate } from "@/lib/formatters";

// Format money: 1500000 → "1.500.000 VNĐ"
const formatted = formatCurrency(1500000);

// Format date: "2025-01-15" → "15/01/2025"  
const formattedDate = formatDate("2025-01-15");
```

### Constants
```typescript
import { API_ENDPOINTS, TOAST_MESSAGES } from "@/lib/constants";

// Use centralized endpoints
const data = await fetch(API_ENDPOINTS.EXPENSES);

// Use consistent messages
toast({ title: TOAST_MESSAGES.SUCCESS.CREATE });
```

### Custom Hooks
```typescript
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useFormattedData } from "@/hooks/useFormattedData";
import { useCrudOperations } from "@/hooks/useCrudOperations";

// Get system settings
const { getCurrency, getLogo } = useSystemSettings();

// Format data consistently
const { formatMoney, formatDisplayDate } = useFormattedData();

// CRUD operations with consistent error handling
const { create, update, delete } = useCrudOperations({
  entityName: "chi phí",
  baseEndpoint: API_ENDPOINTS.EXPENSES,
  queryKey: [API_ENDPOINTS.EXPENSES],
});
```

## 🔧 Maintenance Tasks

### Regular Updates
1. **Dependency Updates**: Run `npm update` monthly
2. **Type Checking**: Run `npm run type-check` before commits  
3. **Database Migrations**: Use `npm run db:push` for schema changes
4. **Error Monitoring**: Check console logs regularly

### Performance Optimization
1. **Query Caching**: Use React Query's built-in caching
2. **Component Memoization**: Use `React.memo` for expensive components
3. **Bundle Analysis**: Run build analysis quarterly
4. **Database Indexing**: Monitor slow queries

### Security
1. **Input Validation**: Always validate user input with Zod schemas
2. **Authentication**: Check authentication on all protected routes
3. **Error Messages**: Don't expose sensitive information in errors
4. **Dependencies**: Monitor for security vulnerabilities

## 🚀 Deployment

### Environment Variables
```bash
DATABASE_URL=          # PostgreSQL connection string
SESSION_SECRET=        # Session encryption key
NODE_ENV=production    # Environment setting
```

### Build Process
```bash
npm run build         # Build production assets
npm run start         # Start production server
```

## 📚 Extending the System

### Adding New Modules
1. Create database schema in `shared/schema.ts`
2. Add storage interface methods in `server/storage.ts`
3. Create API routes in `server/routes.ts`
4. Build frontend components in `client/src/pages/`
5. Add navigation links in appropriate components

### Best Practices
- Follow existing naming conventions
- Write comprehensive TypeScript types
- Implement proper error handling
- Add loading states for all async operations
- Use consistent Vietnamese text throughout
- Leverage existing utility functions and components

### Testing Strategy
- Manual testing of all CRUD operations
- Database connection testing
- Form validation testing
- Error handling verification
- Mobile responsiveness testing

## 🔍 Troubleshooting

### Common Issues
1. **API Parameter Order**: Ensure `apiRequest(url, method, data)` order
2. **Query Key Mismatch**: TanStack Query keys must match API endpoints
3. **Type Errors**: Use shared schema types consistently
4. **Database Connection**: Check `DATABASE_URL` environment variable

### Debug Tools
- Browser DevTools for frontend debugging
- Express server logs for backend debugging
- Database query logs for data issues
- TypeScript compiler for type checking