# Lava Tea Shop Management System

## Overview

This is a comprehensive business management system specifically designed for the Lava Tea Shop. The application provides tools for managing monthly cash flow, tracking revenue and expenses, handling inventory operations, and maintaining business settings. It features a responsive design that works well on both web browsers and mobile devices, offering an app-like experience for mobile users.

The system is built as a full-stack web application using modern technologies and follows a clean architectural pattern with separate client and server components. The application is designed to help shop owners effectively manage their business operations through an intuitive dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface components
- **Styling**: Tailwind CSS with custom tea-themed color palette (tea-brown, tea-light, tea-cream) for brand consistency
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Management**: React Hook Form with Zod for type-safe form validation
- **Component Structure**: Feature-based organization with reusable components and modals

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: Express session-based authentication with bcryptjs for password hashing
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **API Structure**: RESTful endpoints organized around business domains (auth, revenues, expenses, inventory, settings)

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless database platform
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Connection Pooling**: Neon serverless connection pooling for optimal performance
- **Session Storage**: Database-backed sessions for secure user authentication

### Authentication and Authorization
- **Authentication Method**: Session-based authentication using Express sessions
- **Password Security**: bcryptjs for secure password hashing and verification
- **Session Management**: PostgreSQL session store with configurable expiration
- **Authorization**: Middleware-based route protection requiring authenticated sessions
- **User Management**: Phone number-based user identification system

### External Dependencies
- **Database**: Neon PostgreSQL serverless database platform
- **Charts**: Chart.js for revenue and cash flow visualization
- **Development Tools**: Replit-specific plugins for development environment integration
- **Fonts**: Google Fonts (Inter) for consistent typography
- **Build Tools**: ESBuild for server-side bundling, PostCSS for CSS processing

## Design Patterns & Architecture

### Applied Patterns
- **Repository Pattern**: Database operations abstracted through IStorage interface
- **MVC Pattern**: Clear separation of Models (Drizzle schemas), Views (React components), Controllers (Express routes)
- **Facade Pattern**: Simplified API interactions through apiRequest wrapper
- **Component-Based Architecture**: Modular, reusable UI components with consistent interfaces
- **Domain-Driven Design**: Feature-based folder structure organizing code by business domains

### Code Organization Principles
- **Separation of Concerns**: Clear boundaries between data, business logic, and presentation layers
- **Type Safety**: Comprehensive TypeScript usage with shared schema definitions
- **Consistent Error Handling**: Standardized error patterns across API calls and UI feedback
- **Scalable Structure**: Modular components and services designed for easy extension

### Maintainability Features
- **Shared Schema**: Single source of truth for data types (`shared/schema.ts`)
- **Centralized API Logic**: Consistent request handling through queryClient
- **Reusable Components**: Modular UI components with consistent props interfaces
- **Configuration Management**: System settings stored in database for runtime configuration
- **Internationalization Ready**: Vietnamese text centralized for easy translation updates

The application follows a monolithic architecture with clear separation between client and server code, shared schema definitions, and a structured component hierarchy. The system is designed for scalability and maintainability while providing a smooth user experience across different device types.