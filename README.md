# Lava Tea Shop Management System

A comprehensive business management system for Lava Tea Shop with revenue tracking, inventory management, and financial analytics built with React and Express.

## Prerequisites

Before running this application locally, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL database** (local installation or cloud service like Neon, Supabase, etc.)

## Local Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd lava-tea-shop

# Install dependencies
npm install
```

### 2. Database Setup

You'll need a PostgreSQL database. You can either:

**Option A: Use a cloud service (recommended)**
- Create a free PostgreSQL database at [Neon](https://neon.tech) or [Supabase](https://supabase.com)
- Copy the connection string

**Option B: Local PostgreSQL**
- Install PostgreSQL locally
- Create a new database
- Note your connection details

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
# Database connection
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Session secret (any random string)
SESSION_SECRET="your-session-secret-here"

# Port (optional, defaults to 5000)
PORT=5000
```

### 4. Database Migration

Push the database schema:

```bash
npm run db:push
```

### 5. Create Initial User

Run this SQL command in your database to create an admin user:

```sql
INSERT INTO users (phone, username, password, name, role) 
VALUES (
  '0123456789', 
  '0123456789', 
  '$2b$10$spoDlEwJst4Vp0eZVbAD.uz8IuuvjVOjfJcQCQ0eTHz2HADtN0lWq', 
  'Admin User', 
  'admin'
);
```

This creates a user with:
- Phone: `0123456789`
- Password: `password`

### 6. Create Session Table

Create the session table for user authentication:

```sql
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid);
```

### 7. Start the Application

```bash
# Development mode (recommended)
npm run dev

# Or production build
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## Default Login Credentials

- **Phone**: 0123456789
- **Password**: password

## Features

- **Dashboard**: Overview of revenue, expenses, and key metrics
- **Revenue Tracking**: Monthly and yearly revenue management
- **Expense Management**: Track various expense categories
- **Stock Management**: Inventory tracking with stock in/out operations
- **Reserve Funds**: Allocation account management
- **Settings**: User management, shareholders, and expense categories

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Express sessions with bcrypt
- **Charts**: Recharts and Chart.js

## Project Structure

```
├── client/src/          # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── package.json         # Dependencies and scripts
└── drizzle.config.ts    # Database configuration
```

## Troubleshooting

1. **Database connection issues**: Verify your DATABASE_URL is correct and the database is accessible
2. **Session errors**: Make sure the session table exists in your database
3. **Port conflicts**: Change the PORT in your .env file if 5000 is already in use
4. **Build errors**: Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`