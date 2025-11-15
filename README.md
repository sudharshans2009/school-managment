# 🎓 Amrita Vidyalayam Management System

A comprehensive, production-ready school management system built with Next.js 15/16, featuring smart classroom dashboards, real-time attendance tracking, automated timetables, exam management, admission processing, and complete GDPR compliance.

**Status:** ✅ Production Ready | **Version:** 2.0.0 | **Build:** 75/75 Pages Successful

## ✨ Key Highlights

- 🚀 **146+ API Endpoints** - Complete backend infrastructure
- 📧 **Email Verification System** - Automated email verification with Resend
- 🔐 **Role-Based Access Control** - Secure authentication with Better Auth
- 📊 **Advanced Analytics** - Real-time dashboards with 30-day rolling metrics
- 📱 **Smart Classroom Displays** - Interactive classroom dashboards with live data
- ⏰ **Automated Timetables** - 9-period day structure with fixed break timings
- 🎯 **Exam & Grade Management** - Complete assessment lifecycle with A* to F grading
- 📝 **Homework Tracking** - Assignment creation, submission, and grading
- 👥 **Bulk Upload Support** - CSV import for students and teachers
- 🔔 **Multi-Channel Notifications** - Announcements, messages, and alerts
- 🏫 **Admin Management** - Complete CRUD for managing admin users
- 📋 **Admission Processing** - Full application workflow with status tracking
- 🎨 **Design Consistency** - 95% standardization across 75+ pages
- ✅ **Production Ready** - 100% type-safe, fully tested, and documented

## 🚀 Features

### 👨‍💼 Admin Dashboard

**System Management:**

- 📊 Real-time analytics and system metrics (30-day rolling calculations)
- 👥 User management (students, teachers, staff, admins)
- 🏫 Classroom management with unique access codes
- 📚 Subject and curriculum management
- 🔧 System settings and configuration

**Admin User Management:**

- ➕ Create new admin accounts with email/password
- ✏️ Edit admin details (name, email, status)
- 🔄 Activate/deactivate admin accounts
- 🗑️ Delete admins with safety checks (last admin protection)
- 🔍 Search admins by name or email
- 🛡️ Self-protection: Cannot delete or deactivate own account

**Admission Management:**

- 📋 View and process admission applications
- 🔍 Filter by status (pending, under review, test scheduled, accepted, rejected, waitlisted)
- 🎯 Filter by grade level (1-12)
- 📊 Statistics dashboard (total, pending, accepted, rejected applications)
- 👁️ Detailed application view with all information
- ✅ Update application status with workflow
- 💬 Add rejection reasons when declining applications
- 🗑️ Delete restricted to pending/rejected applications only

**Academic Operations:**

- 📅 Calendar management (working days, holidays, custom schedules)
- ⏰ Timetable creation and management (9-period structure)
- 📝 Exam scheduling and grade finalization
- 📊 Report card generation
- 📋 Work done tracking and verification

**Communication:**

- 📢 School-wide announcements
- 📧 Group messaging system
- 📄 Circular management
- 🎉 Event creation and management

**Advanced Features:**

- 📁 Bulk student/teacher import via CSV
- 🔄 Leave management and substitute assignments
- 👪 Parent-teacher meeting scheduling
- 📊 Comprehensive analytics dashboards with accurate metrics

### 👩‍🏫 Teacher Portal

**Classroom Management:**

- 📚 View assigned classes and subjects
- 👥 Student roster with detailed profiles
- 📊 Class performance analytics
- 📅 Daily attendance marking
- ⏰ Access to class timetables

**Academic Tools:**

- 📝 Create and assign homework with deadlines
- ✅ Grade submissions and provide feedback
- 📋 Create and manage exams
- 📊 Upload and manage grades
- 📈 Student performance tracking

**Communication:**

- 💬 Direct messaging with students
- 📢 Classroom announcements
- 🌅 Daily motivational quotes for classroom dashboards
- 📝 Work done reports

**Leave & Substitution:**

- 🏥 Apply for leave (sick, casual, earned, duty, emergency)
- 👀 View leave status and history
- 🔄 Check substitute assignments

### 🧑‍🎓 Student Portal

**Academic Access:**

- 📚 View assigned homework and projects
- ✍️ Submit assignments online
- 📊 Check grades and exam results
- 📅 View class timetable
- 📈 Personal performance analytics

**Communication:**

- 💬 Message teachers
- 📢 View class and school announcements
- 🎉 Event information and registration
- 📄 Access circulars

**Records:**

- ✅ Attendance records and statistics
- 🎓 Academic history
- 📊 Report cards
- 🏆 Behavior points and notes

### 📺 Smart Classroom Dashboard

**Real-Time Display:**

- ⏰ **9-Period Timetable** with fixed break times:
  - Period I: 08:45-09:25
  - Period II: 09:25-10:05
  - **BREAK**: 10:05-10:15
  - Period III: 10:15-10:55
  - Period IV: 10:55-11:35
  - Period V: 11:35-12:15
  - **LUNCH**: 12:15-12:55
  - Period VI: 12:55-13:35
  - Period VII: 13:35-14:15
  - **BREAK**: 14:15-14:25
  - Period VIII: 14:25-15:05
  - Period IX: 15:05-15:45

**Live Information:**

- 📊 Today's attendance summary with statistics
- 📝 Pending homework and assignments
- 📢 School and class announcements
- 🌅 Daily motivational quotes
- 🕐 Live clock and date
- ✅ Current period highlighting

**Security:**

- 🔐 Classroom-specific access codes
- 🔑 Secure key verification
- 🚪 Auto-logout on session end

### 📧 Email & Verification System

**Automated Emails:**

- ✉️ **Email Verification** - Beautiful HTML emails with verification links
- 🔐 **Password Reset** - Secure password recovery flow
- 📧 **Welcome Emails** - Onboarding for new users
- 🎓 **Admin-Created Accounts** - Auto-verified emails for bulk uploads

**Email Templates:**

- 🎨 Professional HTML templates with gradients
- 📱 Mobile-responsive design
- 🔗 One-click verification buttons
- ⏰ 24-hour link expiry

### � User Management

**Profile System:**

- 🖼️ Profile pages with avatars
- ✅ Email verification status badges
- 📊 Account activity tracking
- 🎭 Role-based information display

**Settings:**

- 📧 Email change with re-verification
- 🔐 Password update with current password validation
- 👁️ Password visibility toggles
- ✨ Real-time validation feedback

**Authorization:**

- 🔒 View-only profiles for students and teachers
- ✏️ Admin-only profile editing
- 🛡️ Role-based page redirects
- 🚦 Automatic dashboard routing

### 🔒 Security & Compliance

**Authentication:**

- 🔐 Better Auth integration
- 📧 Email verification required
- 🔑 Secure session management
- 🚪 Auto-logout on inactivity

**Authorization:**

- 👮 Role-Based Access Control (RBAC)
- 🎭 4 user roles: Admin, Teacher, Student, Parent
- 🛡️ Granular permission system
- 🚦 Route-level access control

**GDPR Compliance:**

- 📦 **Right to Data Portability** - Export all user data
- 🗑️ **Right to be Forgotten** - Data deletion requests
- ✅ **Consent Management** - Track and manage user consents
- 📝 **Audit Logging** - Complete action history

**Data Protection:**

- 🔐 Data encryption utilities
- 🔒 Password hashing with bcrypt
- 📊 Audit trail for all actions
- 💾 System backup capabilities

### 📊 Analytics & Reporting

**Admin Analytics:**

- 📈 System-wide statistics
- 👥 User activity metrics
- 📊 Attendance trends
- 💰 Fee collection rates
- 🎓 Academic performance overview

**Teacher Analytics:**

- 📚 Class performance metrics
- 📝 Homework completion rates
- ✅ Attendance patterns
- 🎯 Student progress tracking

**Student Analytics:**

- 📊 Personal grade reports
- 📈 Performance trends
- ✅ Attendance records
- 🏆 Achievement tracking

### 🎯 Automatic Grade System

**7-Level Grading Scale:**

- **A\*** (90-100%): Outstanding
- **A** (80-89%): Excellent
- **B** (70-79%): Very Good
- **C** (60-69%): Good
- **D** (50-59%): Satisfactory
- **E** (40-49%): Pass
- **F** (0-39%): Fail

**Features:**

- ✅ Automatic grade calculation from percentage
- � Color-coded grade display
- 📈 Grade legends on student and teacher views
- 🎯 Consistent grading across all exams

## �🛠️ Tech Stack

### Core Framework

- **Next.js 15/16** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 18** - UI library with Server Components

### Database & ORM

- **PostgreSQL** - Neon serverless database
- **Drizzle ORM** - Type-safe database toolkit
- **Drizzle Kit** - Database migrations

### Authentication & Authorization

- **Better Auth** - Modern authentication solution
- **Email Verification** - Required for all signups
- **Role-Based Access Control** - Admin, Teacher, Student, Parent

### Email Service

- **Resend** - Transactional email service
- **React Email** - Beautiful HTML email templates

### UI & Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Headless component library
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful icon library
- **Recharts** - Chart library for analytics

### State Management & Data Fetching

- **TanStack Query v5** - Data synchronization
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Utilities

- **date-fns** - Date manipulation
- **Sonner** - Toast notifications
- **clsx** - Conditional class names

### Development Tools

- **Bun** - Fast JavaScript runtime & package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Installation

### Prerequisites

- **Bun** (v1.0 or higher)
- **PostgreSQL** database (Neon recommended)
- **Resend Account** for email service

### Setup Steps

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/school-management.git
cd school-management
```

2. **Install dependencies:**

```bash
bun install
```

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Resend Email Service
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Optional: For production
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

4. **Setup database:**

```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate

# Seed initial data (optional)
bun run db:seed
```

5. **Verify setup:**

```bash
bun run db:verify
```

6. **Run development server:**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📧 Email Configuration

### Resend Setup

1. Create a [Resend account](https://resend.com)
2. Add and verify your domain
3. Generate an API key
4. Add to `.env.local`:

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

### Email Verification Flow

1. **Signup**: User registers → Verification email sent automatically
2. **Verify**: User clicks link → Account activated
3. **Admin Created**: Accounts created by admins are auto-verified
4. **Email Change**: Changing email requires re-verification

### Email Templates

All emails use beautiful HTML templates with:

- Professional gradient designs
- Mobile-responsive layout
- One-click action buttons
- Branding consistency

## 🗄️ Database

## 📦 Installation

### Prerequisites

- Bun installed ([https://bun.sh](https://bun.sh))
- Neon Postgres account ([https://neon.tech](https://neon.tech))
- Resend account for emails ([https://resend.com](https://resend.com))

### Setup Steps

1. **Install dependencies**

```bash
bun install
```

2. **Setup environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Better Auth
BETTER_AUTH_SECRET=your_secret_key_generate_with_openssl_rand_base64_32
BETTER_AUTH_URL=http://localhost:3000

# Resend (Email)
RESEND_API_KEY=your_resend_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Generate a secure auth secret:**

```bash
openssl rand -base64 32
```

3. **Setup Database**

Generate migration files:

```bash
bun run db:generate
```

Push schema to database:

```bash
bun run db:push
```

(Optional) Open Drizzle Studio to view database:

```bash
bun run db:studio
```

4. **Run the development server**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
school-management/
├── app/
│   ├── api/
│   │   └── auth/          # Authentication endpoints
│   ├── admin/             # Admin dashboard routes
│   ├── teacher/           # Teacher portal routes
│   ├── student/           # Student portal routes
│   └── smartboard/        # Classroom dashboard routes
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Database schema
│   │   └── index.ts       # Database client
│   ├── providers/         # React providers (Query, Theme)
│   ├── auth.ts            # Better Auth config
│   ├── auth-client.ts     # Client-side auth
│   ├── auth-middleware.ts # Authorization middleware
│   ├── permissions.ts     # Permission system
│   ├── audit.ts          # Audit logging
│   ├── encryption.ts     # Data encryption utilities
│   ├── validations.ts     # Zod schemas
│   ├── helpers.ts         # Utility functions
│   └── utils.ts           # General utilities
├── components/            # React components
│   └── ui/               # shadcn/ui components
└── public/               # Static assets
```

## 🗄️ Database Schema

## 🗄️ Database

### Schema Overview

The database uses **Drizzle ORM** with PostgreSQL and includes:

**Core Entities:**

- 👤 **Users** - All system users with role-based access
- 👨‍🎓 **Students** - Student profiles with parent links
- 👨‍🏫 **Teachers** - Teacher profiles with qualifications
- 🏫 **Classrooms** - Physical and virtual classes
- 📚 **Subjects** - Subject definitions

**Academic Management:**

- 📅 **Timetable** - Class schedules (9-period structure)
- 📝 **Homework** - Assignments and submissions
- 📊 **Exams** - Tests and assessments
- 🎯 **Grades** - Student performance records
- 📄 **Report Cards** - Generated academic reports

**Attendance & Leave:**

- ✅ **Attendance** - Daily attendance records
- 🏥 **Teacher Leaves** - Leave applications and approvals
- 🔄 **Substitute Assignments** - Substitute teacher tracking

**Communication:**

- 📢 **Announcements** - System-wide notices
- 💬 **Messages** - Direct messaging
- 👥 **Group Messages** - Bulk messaging
- 📄 **Circulars** - Official documents
- 💬 **Classroom Messages** - Class-specific messages (quotes)

**Events & Meetings:**

- 🎉 **Events** - School events and activities
- 👪 **Meetings** - Parent-teacher meetings
- 📅 **Calendar** - Custom schedules and holidays

**Administrative:**

- 🎓 **Admissions** - Application processing
- 🚪 **Entrance Tests** - Admission tests
- 📊 **Work Done** - Daily activity reports
- 🏆 **Behavior** - Student behavior tracking
- 📊 **Analytics** - Performance metrics
- 📋 **Audit Logs** - System action history

### Database Scripts

**Essential Commands:**

```bash
# Generate new migrations
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Seed initial data (admin user, sample data)
bun run db:seed

# Verify database setup
bun run db:verify

# Add subjects to database
bun tsx database/add-subjects.ts

# Update timetable structure (9 periods)
bun tsx database/update-timetable.ts

# Purge all data (CAUTION: Deletes everything)
bun tsx database/purge.ts
```

**Timetable Update:**
The `update-timetable.ts` script populates the timetable with the 9-period structure:

```bash
bun tsx database/update-timetable.ts
```

This creates entries for all 12 slots (9 periods + 3 breaks) for each classroom and weekday.

## 📁 Project Structure

```
school-management/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (146+ endpoints)
│   │   ├── admin/           # Admin management APIs
│   │   ├── attendance/      # Attendance tracking
│   │   ├── auth/            # Authentication endpoints
│   │   ├── exams/           # Exam management
│   │   ├── homework/        # Assignment APIs
│   │   ├── messages/        # Messaging system
│   │   ├── students/        # Student operations
│   │   ├── teachers/        # Teacher operations
│   │   ├── timetable/       # Schedule management
│   │   └── user/            # User profile & settings
│   ├── admin/               # Admin dashboard pages
│   ├── teacher/             # Teacher portal pages
│   ├── student/             # Student portal pages
│   ├── smartboard/          # Classroom displays
│   ├── auth/                # Auth pages (signin, signup, verify)
│   ├── profile/             # User profile (view-only)
│   └── settings/            # User settings (email/password)
├── components/              # React components
│   ├── ui/                  # Shadcn UI components
│   ├── layouts/             # Layout components
│   └── providers/           # Context providers
├── database/                # Database utilities
│   ├── schema.ts           # Drizzle schema definitions
│   ├── seed.ts             # Database seeding
│   ├── verify.ts           # Setup verification
│   ├── add-subjects.ts     # Subject population
│   ├── update-timetable.ts # Timetable structure update
│   └── purge.ts            # Data cleanup
├── hooks/                   # Custom React hooks
│   ├── use-mobile.ts       # Mobile detection
│   └── use-role-redirect.ts # Role-based redirects
├── lib/                     # Utility libraries
│   ├── auth.ts             # Better Auth configuration
│   ├── auth-client.ts      # Client-side auth
│   ├── helpers.ts          # Grade calculation utilities
│   ├── permissions.ts      # RBAC permissions
│   ├── validations.ts      # Zod schemas
│   ├── timetable-structure.ts # Immutable timetable
│   ├── encryption.ts       # Data encryption
│   └── audit.ts            # Audit logging
└── drizzle/                 # Database migrations
```

## 🔐 Security Features

### Authentication

- ✅ Email verification required for all signups
- 🔐 Secure password hashing with bcrypt
- 🔑 JWT-based session management
- 🚪 Auto-logout on inactivity
- 🎭 Role-based authentication

### Authorization

- 👮 **Role-Based Access Control (RBAC)**
  - Admin: Full system access
  - Teacher: Class and student management
  - Student: Personal data and assignments
  - Parent: Child's academic information
- 🛡️ Route-level protection
- 🚦 Automatic role-based redirects
- ✋ Permission-based API access

### Data Protection

- 🔒 **GDPR Compliance**
  - Data portability (export all user data)
  - Right to be forgotten (complete data deletion)
  - Consent management tracking
- 📊 Audit logging for all actions
- 🔐 Sensitive data encryption
- 💾 Secure backup procedures

### Email Security

- ✉️ Auto-verification for admin-created accounts
- 🔐 Re-verification on email change
- ⏰ Expiring verification tokens (24 hours)
- 🛡️ Rate limiting on verification emails

## 📋 Available Scripts

### Development

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
```

### Database

```bash
bun run db:generate  # Generate migrations from schema
bun run db:migrate   # Apply migrations to database
bun run db:seed      # Seed database with sample data
bun run db:verify    # Verify database setup
bun run db:studio    # Open Drizzle Studio (database GUI)
```

### Utilities

```bash
# Add subjects to database
bun tsx database/add-subjects.ts

# Update timetable (9-period structure)
bun tsx database/update-timetable.ts

# Purge all data (CAUTION)
bun tsx database/purge.ts
```

### Code Formatting

```bash
# Format JavaScript/TypeScript files
bunx prettier --write "**/*.{js,jsx,ts,tsx}"

# Format specific directory
bunx prettier --write "app/**/*.{js,jsx,ts,tsx}"
```

## 🎯 API Routes

The system includes **146+ API endpoints** across the following categories:

### Admin APIs

- User management (CRUD operations)
- Classroom creation and configuration
- Subject and curriculum management
- System-wide analytics
- Bulk upload (CSV import)

### Teacher APIs

- Classroom management
- Homework creation and grading
- Attendance marking
- Exam management
- Grade submission

### Student APIs

- Homework submission
- Grade viewing
- Attendance records
- Personal analytics

### Communication APIs

- Announcements
- Direct messaging
- Group messages
- Classroom messages (quotes)
- Circulars

### Utility APIs

- Profile management (view-only for students/teachers)
- Settings (email and password updates)
- Calendar management
- Timetable generation
- Report card generation

## 🚀 Deployment

### Environment Variables for Production

```env
# Database
DATABASE_URL="postgresql://user:password@host/db"

# Better Auth
BETTER_AUTH_SECRET="min-32-char-secret-key"
BETTER_AUTH_URL="https://yourdomain.com"

# Resend
RESEND_API_KEY="re_your_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Build & Deploy

```bash
# Install dependencies
bun install

# Build the application
bun run build

# Start production server
bun run start
```

### Recommended Platforms

- **Vercel** - Zero-config deployment for Next.js
- **Railway** - Easy database and app hosting
- **Neon** - Serverless PostgreSQL database
- **Fly.io** - Global deployment platform

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- `AUTH_SETUP.md` - Authentication system details
- `CALENDAR_SYSTEM.md` - Calendar and scheduling
- `EXAM_SYSTEM.md` - Exam management workflow
- `HOMEWORK_SYSTEM.md` - Assignment system
- `SCHEMA_REFERENCE.md` - Complete database schema
- `SECURITY_COMPLIANCE.md` - GDPR and security
- `SETUP_COMPLETE.md` - Setup verification
- `DESIGN_AUDIT_REPORT.md` - Design consistency analysis
- `STUDENT_FEATURES_GUIDE.md` - Student portal features
- `API_STUDENT_FEATURES.md` - Student API documentation
- `NOTIFICATION_SYSTEM.md` - Notification architecture
- `TIMETABLE_UPDATE.md` - Timetable structure details
- `TAURI_SETUP.md` - Desktop application setup

## 📈 Project Statistics

- **Pages:** 75+ across all portals (Admin: 42, Teacher: 18, Student: 15)
- **API Endpoints:** 146+ RESTful endpoints
- **Database Tables:** 40+ tables with full relationships
- **Components:** 100+ reusable React components
- **Server Actions:** 50+ optimized server-side functions
- **Design Consistency:** 95% standardization achieved
- **Build Status:** ✅ 75/75 pages building successfully
- **TypeScript Coverage:** 100% type-safe codebase

## 🎓 User Roles & Permissions

### Admin

- ✅ Full system access
- 👥 Create and manage all users
- 🏫 Configure classrooms and subjects
- 📊 View all analytics and reports
- 🔧 System configuration
- ✏️ Edit any user profile

### Teacher

- 📚 Manage assigned classrooms
- 👨‍🎓 View student information
- 📝 Create homework and exams
- ✅ Mark attendance
- 📊 Grade assignments
- 💬 Message students
- 🌅 Set classroom quotes
- 👀 View-only own profile

### Student

- 📖 View homework and submit assignments
- 📊 Check grades and attendance
- 💬 Message teachers
- 📅 View timetable
- 📈 Personal analytics
- 👀 View-only own profile

### Parent

- 👨‍👩‍👧 View children's information
- 📊 Check academic progress
- ✅ Monitor attendance
- 💬 Communicate with teachers
- 📅 Schedule meetings

## 🆕 Recent Updates

### ✅ November 2025 Updates

**Admin Management Enhancements:**
- **Admin User Management** - Complete CRUD system for managing admin users
  - Create, edit, activate/deactivate, and delete admin accounts
  - Safety features: Cannot delete last admin or own account
  - Search functionality by name/email
  - Role-based permissions enforced

- **Admission Application Management** - Full application processing system
  - Filter by status (pending, under review, accepted, rejected, etc.)
  - Filter by grade level (1-12)
  - Status update workflow with rejection reasons
  - Statistics dashboard (total, pending, accepted, rejected)
  - Detailed view with all applicant information
  - Delete restricted to pending/rejected applications only

- **Attendance Metrics Fix** - System overview now shows accurate attendance rates
  - Changed from daily to 30-day rolling calculation
  - Provides meaningful percentage based on recent data

- **Design Consistency Audit** - Comprehensive design system analysis
  - 75+ pages audited across all portals
  - 95% consistency achieved in card styling
  - Standardized hover effects, spacing, and grid patterns
  - Full audit report available in `docs/DESIGN_AUDIT_REPORT.md`

### ✅ Core Features (Production Ready)

- **Automatic Grade System** (A\* to F)
  - 7-level grading scale
  - Automatic calculation from percentage
  - Color-coded displays
  - Consistent across all exams

- **Dynamic Quote System**
  - Teacher-controlled motivational quotes
  - Displayed on smartboard and student dashboard
  - Classroom-specific messages
  - Easy update through teacher portal

- **Fixed Timetable Structure**
  - Immutable 9-period day structure
  - 3 scheduled breaks (10:05-10:15, 12:15-12:55, 14:15-14:25)
  - Consistent timings across all classes
  - Automatic current period highlighting

- **Email Verification System**
  - Beautiful HTML email templates
  - Required verification for all signups
  - Auto-verified for admin-created accounts
  - Re-verification on email change

- **Profile & Settings Pages**
  - View-only profiles for students and teachers
  - Admin can edit any profile
  - Email and password update functionality
  - Real-time validation and feedback

- **Role-Based Redirects**
  - Automatic routing to appropriate dashboards
  - Security-first architecture
  - Custom `useRoleRedirect` hook
  - Seamless user experience

## 🗺️ Roadmap

### ✅ Completed (Production Ready)

- [x] **Complete Database Schema** - All tables and relationships
- [x] **Authentication & Authorization** - Better Auth with RBAC
- [x] **Admin Dashboard** - Full featured with 42+ pages
- [x] **Teacher Portal** - Complete classroom management (18+ pages)
- [x] **Student Portal** - Academic access and tracking (15+ pages)
- [x] **Smartboard Dashboard** - Live classroom displays
- [x] **Admission Management** - Application processing workflow
- [x] **Admin User Management** - CRUD with safety features
- [x] **Email Verification** - Automated verification system
- [x] **Attendance System** - Daily marking and analytics
- [x] **Homework Management** - Creation, submission, grading
- [x] **Exam & Grade System** - Complete assessment lifecycle
- [x] **Timetable Management** - 9-period day structure
- [x] **Leave Management** - Applications and approvals
- [x] **Substitute System** - Teacher replacement tracking
- [x] **Communication** - Announcements, messages, circulars
- [x] **Analytics** - Role-specific dashboards
- [x] **CSV Bulk Upload** - Students and teachers
- [x] **Design System** - 95% consistency achieved

### 🚧 In Progress

- 📱 **Desktop Application** - Tauri-based native app
- 🎨 **Theme Customization** - User-selectable themes
- 📊 **Advanced Analytics** - Enhanced insights and predictions

### 📋 Planned

- 🌐 **Multi-language Support** - i18n implementation
- 📹 **Video Conferencing** - Integrated virtual classrooms
- 📚 **Digital Library** - Resource management system
- 🏆 **Gamification** - Achievement badges and rewards
- 💳 **Payment Gateway** - Fee collection integration
- 📱 **Parent Mobile App** - React Native application
- 🤖 **AI-Powered Insights** - Predictive analytics
- 🔔 **Push Notifications** - Real-time alerts
- 📱 **Progressive Web App** - Offline capabilities

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

Created with ❤️ for modern schools

## 🙏 Acknowledgments

- Shadcn for the amazing UI components
- Vercel for Next.js framework
- Drizzle team for the excellent ORM
- Better Auth for authentication solution
- Resend for reliable email delivery

---

**Built with Next.js 15, TypeScript, and PostgreSQL**

### Security & Compliance Tables

- **audit_logs** - System activity audit trail
- **role_permissions** - Role-based permission configuration
- **user_permissions** - User-specific permission overrides
- **user_consents** - GDPR consent tracking
- **data_export_requests** - Data portability requests
- **data_deletion_requests** - Right to be forgotten requests
- **system_backups** - Backup metadata and tracking

## 🔐 Authentication

Built with Better Auth for secure, flexible authentication:

- Email/Password authentication
- Role-based access control (Admin, Teacher, Student, Parent)
- Granular permissions system (see [Security Documentation](docs/SECURITY_COMPLIANCE.md))
- Secure session management
- Classroom code + key verification for smartboards
- Audit logging for all actions

## 🎨 UI Components

Using shadcn/ui for beautiful, accessible components:

- Pre-built forms, dialogs, and data tables
- Dark mode support
- Responsive design
- Consistent styling with Tailwind CSS

---

*For detailed project statistics, roadmap, and recent updates, see the sections above.*

**Last Updated:** November 2025
