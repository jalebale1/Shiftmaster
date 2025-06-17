# ShiftMaster - Employee Scheduling System

## Overview

ShiftMaster is a simplified web-based employee scheduling application built with React, Express.js, and SQLite. The system provides a clean solution for managing employee schedules and shift assignments with an intuitive interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture  
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: PostgreSQL-based session storage
- **API Design**: RESTful endpoints with structured error handling
- **Development**: Hot reload with tsx and Vite integration

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Tables**:
  - `employees`: Core employee information with role assignments
  - `shifts`: Shift scheduling with time slots and employee assignments
  - `abTests`: A/B testing framework for schedule optimization
  - `shiftTemplates`: Reusable shift patterns and configurations

## Key Components

### Schedule Management
- **Visual Grid Interface**: Interactive weekly schedule grid with drag-and-drop functionality
- **Shift Assignment**: Direct employee-to-shift assignment with conflict detection
- **Template System**: Predefined shift templates for quick scheduling
- **Real-time Updates**: Live schedule updates using React Query mutations

### Employee Management
- **Employee Profiles**: Comprehensive employee data with roles and departments
- **Visual Identification**: Color-coded employee avatars with initials
- **Department Organization**: Structured employee grouping by department

### Analytics & Optimization
- **Schedule Analytics**: Coverage metrics, total hours, and conflict detection
- **A/B Testing Framework**: Built-in experimentation for schedule optimization
- **Performance Tracking**: Efficiency metrics for different scheduling approaches

### User Interface
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: ARIA-compliant components with keyboard navigation
- **Modern UI**: Clean, professional interface with consistent design patterns

## Data Flow

1. **Client-Server Communication**: RESTful API calls via fetch with TanStack Query caching
2. **Database Operations**: Drizzle ORM handles all database interactions with type safety
3. **State Management**: Server state cached and synchronized via React Query
4. **Real-time Updates**: Optimistic updates with server reconciliation
5. **Error Handling**: Centralized error boundaries with user-friendly messages

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL serverless database driver
- **wouter**: Lightweight React routing
- **react-hook-form**: Form state management and validation

### UI Component Libraries
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon PostgreSQL with environment-based connection strings
- **Port Configuration**: Default port 5000 with external port 80 mapping

### Production Build
- **Frontend Build**: Vite production build to `dist/public`
- **Backend Build**: esbuild bundling of server code to `dist/index.js`
- **Asset Serving**: Static file serving via Express in production
- **Environment Variables**: PostgreSQL connection via `DATABASE_URL`

### Replit Configuration
- **Modules**: Node.js 20, web development, and PostgreSQL 16
- **Auto-deploy**: Configured for automatic deployment with build scripts
- **Development Workflow**: Integrated development environment with live preview

## Changelog

```
Changelog:
- June 16, 2025. Initial setup
- June 16, 2025. Updated to traditional time table format per user requirements:
  * Changed branding from "ShiftManager Pro" to "Bluesun RC raspored"
  * Removed A/B testing features per user request
  * Implemented traditional 2-week schedule grid matching uploaded images
  * Created daily hourly task view with color-coded assignments
  * Used Croatian day names (pon, uto, sri, čet, pet, sub, ned)
  * Designed layout to match traditional reservation center shift tables
- June 16, 2025. Enhanced mouse controls and fixed TypeScript errors:
  * Removed scroll wheel functionality from shift/task type selection
  * Middle mouse button now cycles through available types
  * Right mouse button resets cells with state reverting capability
  * Fixed TypeScript errors causing unhandled rejections
  * Implemented auto-saving for all drag-and-paint operations
- June 16, 2025. Major restructure to ShiftMaster:
  * Changed branding from "Bluesun RC raspored" to "ShiftMaster"
  * Started SQLite database integration for simplified deployment
  * Updated HTML title and sidebar branding
  * Fixed DOM nesting warning in sidebar navigation
  * Prepared for technology stack simplification (PostgreSQL → SQLite)
- June 16, 2025. Fixed "Clear All" button functionality:
  * Added `/api/save-shifts` endpoint for bulk shift operations
  * Added `/api/clear-all-shifts` endpoint for complete schedule clearing
  * Updated frontend to use new API endpoints instead of generating large delete arrays
  * Fixed issue where "Clear All" would reset to default shifts instead of clearing all
  * Added proper loading states and error handling for clear operations
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Project branding: "ShiftMaster" (evolved from "Bluesun RC raspored")
Visual design: Traditional time table format matching uploaded reference images
Technology preference: SQLite over PostgreSQL for simplified deployment
Code organization: Clean folder structure with /models, /routes, /utils separation
Remove: A/B testing functionality and complex statistics
```