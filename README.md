# 🎓 Amrita School Management System

A comprehensive, modern school management system with smart classroom dashboards, real-time attendance tracking, fee management, homework submission, and more.

## 🚀 Features

### 👨‍💼 Admin Dashboard
- Complete system overview and analytics
- Create and manage classrooms with unique codes and keys
- Assign teachers to subjects and classrooms
- Manage students, parents, and staff
- Monitor attendance, fees, and performance
- Generate reports and insights

### 👩‍🏫 Teacher Portal
- Manage multiple classrooms and subjects
- Create and grade homework/assignments
- Mark and track attendance
- Post announcements to classroom dashboards
- View student performance analytics

### 🧑‍🎓 Student Portal
- View assigned homework and projects
- Submit assignments online
- Check attendance records
- View class timetable and announcements
- Access study materials

### 📺 Smart Classroom Dashboard
- Real-time display for each classroom
- Today's timetable and schedule
- Announcements and homework reminders
- Attendance summaries with charts
- Motivational messages and school notices

### 💰 Fee Management
- Flexible fee structure by class/category
- Online payment integration (Razorpay/Stripe ready)
- Automated invoice generation
- Payment history and receipts
- Overdue notifications

## 🛠️ Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Database:** Neon Postgres (Serverless)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **State Management:** TanStack Query (React Query)
- **Validation:** Zod
- **Styling:** Tailwind CSS + shadcn/ui
- **Email:** Resend
- **Package Manager:** Bun

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
│   ├── validations.ts     # Zod schemas
│   ├── helpers.ts         # Utility functions
│   └── utils.ts           # General utilities
├── components/            # React components
│   └── ui/               # shadcn/ui components
└── public/               # Static assets
```

## 🗄️ Database Schema

### Core Tables
- **users** - Admin, teachers, students, parents
- **classrooms** - Class information with unique codes
- **subjects** - Subject catalog
- **teacher_assignments** - Many-to-many teacher-classroom-subject mapping
- **students** - Student profiles and details
- **homework** - Assignments and projects
- **homework_submissions** - Student submissions
- **attendance** - Daily attendance records
- **fee_structures** - Fee configuration
- **fee_payments** - Payment transactions
- **announcements** - School and class announcements
- **timetable** - Class schedules

## 🔐 Authentication

Built with Better Auth for secure, flexible authentication:
- Email/Password authentication
- Role-based access control (Admin, Teacher, Student, Parent)
- Secure session management
- Classroom code + key verification for smartboards

## 🎨 UI Components

Using shadcn/ui for beautiful, accessible components:
- Pre-built forms, dialogs, and data tables
- Dark mode support
- Responsive design
- Consistent styling with Tailwind CSS

## Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
```

## 📊 Features Roadmap

- [x] Database Schema Design
- [x] Authentication Setup
- [x] React Query Integration
- [ ] Admin Dashboard
- [ ] Teacher Portal
- [ ] Student Portal
- [ ] Smartboard Dashboard
- [ ] Payment Gateway Integration
- [ ] Real-time Updates (WebSockets)
- [ ] Notification System
- [ ] Analytics & Reporting

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---