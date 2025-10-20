# Learning Management System

## Overview

This is a comprehensive Learning Management System (LMS) designed for training centers, supporting four distinct user roles: students, trainers, sales consultants, and administrators. The system provides role-specific portals for managing courses, enrollments, progress tracking, task assignments, scheduling, and student queries.

The application is built as a full-stack web platform with a React-based frontend and Express backend, using PostgreSQL for data persistence and Replit's authentication system for user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** Tailwind CSS with custom design system based on Material Design principles

**Design System:**
- Material Design-inspired approach prioritizing clarity and efficiency for educational platforms
- Comprehensive theming supporting light/dark modes
- Role-specific color coding (Admin: Purple, Sales: Orange, Trainer: Indigo, Student: Blue)
- Typography: Inter font family for UI, JetBrains Mono for code/IDs
- Custom CSS variables for consistent color management and elevation effects

**Component Architecture:**
- Role-based routing with separate route configurations for each user type
- Reusable UI components (UserAvatar, RoleBadge, AppSidebar)
- Theme provider for dark/light mode switching
- Comprehensive component library from shadcn/ui (buttons, cards, dialogs, forms, tables, etc.)

**Build System:**
- Vite for development server and production builds
- Path aliases for clean imports (@/, @shared/, @assets/)
- TypeScript with strict mode enabled
- ESM module format throughout

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **ORM:** Drizzle ORM with Neon serverless PostgreSQL adapter
- **Session Management:** express-session with PostgreSQL session store
- **Authentication:** OpenID Connect via Replit Auth (Passport.js strategy)

**API Design:**
- RESTful API structure with `/api` prefix
- Role-based access control middleware enforcing permissions
- Separation of concerns with dedicated route handlers per role
- Centralized error handling middleware

**Authentication & Authorization:**
- Custom username/password authentication system (VPS-ready, no Replit dependencies)
- Session-based authentication with httpOnly secure cookies and sameSite protection
- Bcrypt password hashing with 10 salt rounds
- User role stored in database (admin, sales_consultant, trainer, student)
- Middleware guards protecting routes based on user roles
- Password change functionality for all authenticated users
- Admin-only user creation with initial password assignment

**Demo User Credentials:**
- Admin: username=`admin`, password=`admin123`
- Trainer: username=`trainer1`, password=`trainer123`
- Sales Consultant: username=`sales1`, password=`sales123`
- Student: username=`student1`, password=`student123`

Note: Users can change their passwords after first login using the password change endpoint.

**Database Setup:**
- PostgreSQL database provisioned via Replit
- Database migrations applied using Drizzle ORM (`npm run db:push`)
- Demo users seeded using `server/seed.ts` script

**Data Access Layer:**
- Storage abstraction layer (`storage.ts`) providing clean data access methods
- Drizzle ORM for type-safe database queries
- PostgreSQL connection pooling via Neon serverless

### Database Schema

**Core Tables:**
- **sessions:** Session storage for custom authentication
- **users:** User profiles with role assignment, username, and hashed passwords
- **courses:** Course catalog with title, description, PDF materials
- **modules:** Course content broken into learnable modules
- **enrollments:** Student-course registrations with progress tracking
- **trainerAssignments:** Links trainers to courses they teach
- **moduleProgress:** Tracks student completion of individual modules
- **tasks:** Assignments from trainers to students
- **schedules:** Time-based scheduling for courses/sessions
- **queries:** Student questions/support tickets with trainer responses
- **relatedCourses:** Relationship table for course prerequisites/suggestions
- **classMaterials:** Video and note uploads with expiration tracking and automatic cleanup
- **materialAssignments:** Tracks student assignments for class materials
- **activityLogs:** Comprehensive activity tracking for all user actions (login, logout, course assignments, etc.)

**Database Architecture Decisions:**
- PostgreSQL chosen for robust relational data handling and ACID compliance
- Neon serverless for scalable, serverless PostgreSQL hosting
- UUID-based primary keys using `gen_random_uuid()` for global uniqueness
- Timestamp tracking (createdAt, updatedAt) on major entities
- Drizzle schema with TypeScript types for compile-time safety
- Zod validation schemas generated from Drizzle for runtime validation

### External Dependencies

**Core Infrastructure:**
- **Neon Database:** Serverless PostgreSQL database hosting (@neondatabase/serverless)
- **Custom Authentication:** Username/password authentication with bcrypt hashing
- **Session Management:** Express-session with PostgreSQL session store

**UI Component Libraries:**
- **Radix UI:** Unstyled, accessible component primitives (@radix-ui/react-*)
- **shadcn/ui:** Pre-styled component collection built on Radix UI
- **Lucide React:** Icon library for consistent iconography

**State & Data Management:**
- **TanStack Query:** Server state management and caching (@tanstack/react-query)
- **React Hook Form:** Form state management (@hookform/resolvers)
- **Zod:** Runtime type validation (drizzle-zod for schema validation)

**Development & Build:**
- **Vite:** Frontend build tool and dev server
- **Replit Vite Plugins:** Development experience enhancements (@replit/vite-plugin-*)
- **esbuild:** Backend bundler for production builds
- **tsx:** TypeScript execution for development

**Styling & Design:**
- **Tailwind CSS:** Utility-first CSS framework
- **class-variance-authority:** Component variant management
- **Google Fonts:** Inter and JetBrains Mono font families

**Session & Storage:**
- **connect-pg-simple:** PostgreSQL session store for Express
- **express-session:** Session middleware with secure cookie configuration

**Date & Utilities:**
- **date-fns:** Date manipulation and formatting
- **nanoid:** Unique ID generation
- **memoizee:** Function result caching

## Recent Changes

### Admin Activity Tracking & Super Access Features (October 2025)

**Activity Tracking System:**
- Implemented comprehensive activity logging to track all user actions
- Created `activityLogs` database table with user, action, details, and timestamp
- Built `ActivityLogger` service (`server/activityLogger.ts`) for centralized logging
- Activity logging integrated into login/logout flows and admin operations
- Admin dashboard displays activity feed with user details, actions, and timestamps

**Admin Super Access Features:**
- **Activity Logs Page** (`/activity-logs`): View all user activities with beautiful timeline feed
- **Manage Courses Page** (`/manage-courses`): Assign courses to trainers and enroll students
- Admin can now directly assign courses to any trainer
- Admin can now enroll any student in any course
- Both operations are logged in the activity tracking system

**API Endpoints Added:**
- `GET /api/admin/activity-logs` - Fetch all activity logs
- `POST /api/admin/assign-course-to-trainer` - Assign courses to trainers
- `POST /api/admin/enroll-student` - Enroll students in courses
- `GET /api/admin/trainers` - List all trainers
- `GET /api/admin/students` - List all students

**Technical Implementation:**
- Activity logs stored in PostgreSQL with user ID, action type, and details
- Real-time cache invalidation using TanStack Query
- Toast notifications for success/error feedback
- Loading states and skeleton UI during data fetching
- Role-based access control ensuring admin-only access

**Suggested Future Enhancements:**
- Add composite indexes on `activity_logs.user_id` and `created_at` for better performance
- Extend activity log filtering (by action type, user, date range)
- Add test coverage for course assignment and enrollment workflows