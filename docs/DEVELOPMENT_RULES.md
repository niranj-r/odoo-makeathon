# Brightloop Development Rules & Collaboration Standards

## 1. Member Responsibilities
Brightloop is developed by four team members:
- **Member 1 (Our Scope)**: Authentication, User Profiles, Roles, Products, Product Variants, Subscription Plans, Taxes, Discounts.
- **Member 2**: Subscriptions Lifecycle, Quotation Templates, Status State Machine.
- **Member 3**: Invoicing, Automated Tax Calculations, Billing Runs, Payment Capture.
- **Member 4**: Financial Analytics, MRR/ARR Reports, Overdue Collections Dashboard.

---

## 2. Core Architectural Principles

### 2.1. Do Not Implement Other Members' Logic
- Keep Member 1 code isolated under designated controllers and services.
- Do not create mock or partial implementations of Member 2/3/4 domains in Member 1 components.
- Expose clear database foreign keys and APIs that other members can connect to.

### 2.2. Technology Restrictions
- **Frontend**: Plain React (Vite) + JavaScript JSX.
- **Styling**: Strictly **Plain CSS** using CSS variables defined in `global.css`.
  - **NO Tailwind CSS**.
  - **NO TypeScript**.
  - **NO Next.js**.
  - **NO Firebase**.
  - **NO heavy external UI libraries**.
- **Icons**: Use only `lucide-react`.

### 2.3. Security & Access Control
- **Backend Role Verification**: Never rely solely on client-side route guards. All protected backend APIs must verify bearer tokens and validate database roles using `verifyToken` and `requireRole` middleware.
- **Service Role Key Isolation**: The Supabase Service Role Key must strictly reside on the backend (`.env`). It must never be exposed to the React frontend.
- **No Insecure Profile Creation**: Public sign-ups are restricted to the `CUSTOMER` role. Admin/Staff role assignment is strictly guarded by the database trigger and admin-only backend endpoints.

---

## 3. Code Style & Naming Conventions
- **Component Files**: PascalCase (e.g. `AdminLayout.jsx`, `InputField.jsx`).
- **Hooks**: camelCase starting with `use` (e.g. `useAuth.js`).
- **Services & Utils**: camelCase (e.g. `supabase.js`, `api.js`).
- **CSS Classes**: Kebab-case prefixed by component purpose (e.g. `.auth-card`, `.btn-primary`, `.form-group`).
- **Database Tables & Columns**: snake_case (e.g. `subscription_plans`, `sales_price`).
- **Roles & Statuses**: UPPERCASE constants (`ADMIN`, `STAFF`, `CUSTOMER`; `ACTIVE`, `INACTIVE`).

---

## 4. UI Design Consistency
Brightloop employs an enterprise SaaS aesthetic:
- **Primary Navy**: `#1B3C53`
- **Background**: `#F9F3EF`
- **Secondary Sand**: `#D2C1B6`
- **Accent**: `#1B3C53`
- **Card Background**: `#FFFFFF`
- **Text Color**: `#1B242C` / `#5F6C7B`

Every form component must provide:
- Clear visual labels.
- Interactive focus states.
- Field-level error messages.
- Accessible loading spinners on submit buttons.

