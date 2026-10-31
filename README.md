# BRIGHTLOOP – Subscription Management Platform
## Phase 1: Foundation Setup (Member 1)

**Brightloop** is a unified SaaS subscription platform designed to automate recurring billing, quotation workflows, subscription lifecycles, and financial reporting.

This repository contains the **Member 1 Foundation Setup**, establishing:
- Supabase PostgreSQL Database with Row Level Security (RLS)
- Supabase Auth Integration
- Role-Based Access Control (RBAC): `ADMIN`, `STAFF`, `CUSTOMER`
- Express Node.js Backend API with JWT Token Verification Middleware
- React + Vite Single-Page Application (plain CSS, enterprise SaaS design)

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, JavaScript (JSX)
- **Styling**: Plain CSS (Custom Design System, `#1B3C53` Navy & `#F9F3EF` Sand)
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Backend**: Node.js, Express, CORS, Dotenv
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **SDK**: `@supabase/supabase-js`

> **Restrictions Enforced**:
> - Plain CSS only (No Tailwind, No MUI, No CSS frameworks).
> - Pure JavaScript JSX (No TypeScript).
> - Modular, decoupled architecture for seamless multi-developer team collaboration.

---

## 2. Project Architecture & Folder Structure

```
brightloop/
│
├── frontend/                     # React + Vite Client
│   ├── src/
│   │   ├── assets/               # Branding assets & SVG icons
│   │   ├── components/
│   │   │   ├── common/           # Button, LoadingSpinner, Alert, Toast, SetupBanner
│   │   │   └── forms/            # InputField, PasswordField (with strength checklist)
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx   # Admin console layout with role badge & navigation
│   │   │   ├── StaffLayout.jsx   # Staff operations workspace layout
│   │   │   └── CustomerLayout.jsx# Customer portal layout
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── admin/            # Admin Dashboard with Staff creation & RBAC monitor
│   │   │   ├── staff/            # Staff Operations Dashboard
│   │   │   └── customer/         # Customer Subscription Portal
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Central auth state & Supabase Auth listener
│   │   ├── hooks/
│   │   │   └── useAuth.js        # AuthContext hook
│   │   ├── services/
│   │   │   └── supabase.js       # Reusable Supabase client
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx     # Route declarations
│   │   │   └── ProtectedRoute.jsx# Role-based route guard
│   │   ├── styles/
│   │   │   └── global.css        # Plain CSS design tokens & SaaS components
│   │   ├── App.jsx               # Application root
│   │   └── main.jsx              # React DOM entry
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js       # Server-side Supabase client (Service Role Key)
│   │   ├── middleware/
│   │   │   ├── auth.js           # Bearer token verification with Supabase Auth
│   │   │   ├── roles.js          # Role authorization guard (requireRole)
│   │   │   └── errorHandler.js   # Centralized error handler
│   │   ├── routes/
│   │   │   ├── healthRoutes.js   # GET /api/health
│   │   │   └── authRoutes.js     # GET /api/auth/me, POST /api/users/staff, GET /api/users
│   │   ├── controllers/
│   │   │   └── authController.js # Auth and user management business logic
│   │   ├── app.js                # Express app configuration & middleware
│   │   └── server.js             # HTTP server entrypoint
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── schema.sql                # Complete SQL schema, RLS policies, triggers & procedures
│
├── docs/
│   ├── DATABASE_SCHEMA.md        # Comprehensive DB architecture documentation
│   ├── API_CONTRACTS.md          # REST API contracts & error formats
│   └── DEVELOPMENT_RULES.md      # Coding conventions & 4-member collaboration rules
│
├── .gitignore
└── README.md
```

---

## 3. Database Setup (Supabase)

### Step 1: Run the Database Migrations
1. Open your Supabase project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to the **SQL Editor** tab from the left sidebar.
3. Open `database/schema.sql` in this repo, copy its contents, paste them into the SQL Editor, and click **Run**.
4. This command will:
   - Create `public.profiles` linked to `auth.users(id)` with RLS enabled.
   - Attach the `handle_new_user()` trigger to automatically create a profile with the **CUSTOMER** role upon user sign-up.
   - Enforce database-level rules preventing unauthorized role or status tampering.
   - Create tables for Member 1's domain: `products`, `product_variants`, `subscription_plans`, `taxes`, and `discounts`.

### Step 2: Create the Initial Administrator Account
1. In the Brightloop app, register an account (e.g., `admin@brightloop.com`), OR invite the user directly via Supabase Auth dashboard.
2. Go to the Supabase **SQL Editor** and run:
   ```sql
   SELECT public.promote_user_to_admin('admin@brightloop.com');
   ```
3. That account now holds the `ADMIN` role with full access to the admin console.

---

## 4. Environment Variables Configuration

### Frontend Configuration (`brightloop/frontend/.env`)
Create `brightloop/frontend/.env` based on `brightloop/frontend/.env.example`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```
*(Never place the service role key in frontend/.env!)*

### Backend Configuration (`brightloop/backend/.env`)
Create `brightloop/backend/.env` based on `brightloop/backend/.env.example`:
```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## 5. Running the Project Locally

### 5.1. Backend Server
```bash
cd brightloop/backend
npm install
npm run dev
```
- Server runs on: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

### 5.2. Frontend Application
```bash
cd brightloop/frontend
npm install
npm run dev
```
- Frontend runs on: `http://localhost:3000`

---

## 6. Authentication & Role-Based Access Features

| Role | Access URL | Permissions & Capabilities |
|---|---|---|
| **ADMIN** | `/admin/dashboard` | Full control: products, variants, subscription plans, taxes, discounts, user directory, and creating internal staff accounts. |
| **STAFF** | `/staff/dashboard` | Internal operations: view customer directory, handle quotes and subscriptions. Cannot alter taxes/plans or create staff accounts. |
| **CUSTOMER**| `/portal/dashboard` | Self-service portal: view own subscriptions, invoices, profile. Strict RLS isolation prevents viewing other customers' data. |

### Password Security Requirements
All user passwords must satisfy:
- Minimum 9 characters (length > 8)
- At least 1 uppercase letter (`A-Z`)
- At least 1 lowercase letter (`a-z`)
- At least 1 special character (`!@#$%^&*...`)

Interactive real-time checklist indicators guide users during registration and password reset.

---

## 7. Protected Backend Endpoints

All protected endpoints require an `Authorization: Bearer <supabase_jwt>` header:

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server health & Supabase connectivity check |
| `GET` | `/api/auth/me` | Any Authenticated | Verifies JWT and returns database profile & role |
| `POST` | `/api/users/staff` | `ADMIN` only | Provisions internal staff account using Supabase Admin API |
| `GET` | `/api/users` | `ADMIN` only | Lists all users with optional role & status filter |
| `PATCH` | `/api/users/:id/status` | `ADMIN` only | Activates/deactivates user accounts |

---

## 8. Multi-Developer Collaboration (Members 1, 2, 3, 4)
Please refer to `docs/DEVELOPMENT_RULES.md` and `docs/API_CONTRACTS.md` for guidelines on extending the platform without interfering with Member 1's authentication and product catalogs.

