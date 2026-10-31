<div align="center">

# 🚀 BrightLoop
### Subscription Management & Billing Platform

*A modern SaaS subscription management system that automates the complete lifecycle of subscription businesses—from product creation to billing, payments, and revenue analytics.*

![Hackathon](https://img.shields.io/badge/Hackathon-Project-blue?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%20JSX-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

# Project Overview

BrightLoop is a **Subscription Management & Billing Platform** built for businesses that operate on recurring subscriptions.

Instead of manually tracking subscriptions in spreadsheets, generating invoices one by one, and matching payments manually, BrightLoop automates the complete subscription lifecycle.

The platform enables businesses to:

- Manage subscription products and plans
- Create quotations
- Convert quotations into subscriptions
- Generate invoices automatically
- Track payments
- Manage taxes and discounts
- View real-time revenue analytics
- Allow customers to manage their own subscriptions

---

# Problem Statement

Many subscription-based businesses still rely on manual processes for managing subscriptions.

Common problems include:

- Missed renewals
- Incorrect invoices
- Duplicate billing
- Manual payment tracking
- No visibility into recurring revenue
- Time-consuming reporting

These issues lead to revenue loss and poor operational efficiency.

---

# Our Solution

BrightLoop provides a centralized platform that automates subscription billing while giving administrators, staff, and customers role-specific dashboards.

The system manages the entire lifecycle:

```
Product
    ↓
Plan
    ↓
Quotation
    ↓
Subscription
    ↓
Invoice
    ↓
Payment
    ↓
Revenue Dashboard
```

---

# Key Features

## Authentication & Role Management

- User Registration
- Secure Login
- Forgot Password
- Role Based Access Control
- Admin
- Staff
- Customer Portal

---

## Product Management

- Create Products
- Product Variants
- Dynamic Pricing
- Product Notes
- Product Types
- Product Search

---

## Subscription Plans

- Daily Billing
- Weekly Billing
- Monthly Billing
- Yearly Billing
- Minimum Quantity
- Plan Availability
- Pause Subscription
- Resume Subscription
- Auto Close
- Renewal

---

## Customer Management

- Customer Profiles
- Customer Search
- Customer History
- Customer Subscriptions
- Customer Invoices

---

## Quotation System

- Quotation Templates
- Validity Period
- Product Lines
- Taxes
- Totals
- Convert to Subscription

---

## Subscription Management

Subscription Lifecycle

```
Draft
   ↓
Quotation
   ↓
Confirmed
   ↓
Active
   ↓
Closed
```

Features

- Renew
- Pause
- Resume
- Cancel
- Early Closure

---

## Invoice Management

- Automatic Invoice Generation
- Invoice Status
- PDF Download
- Print Invoice
- Email Invoice
- Automatic Tax Calculation
- Duplicate Billing Prevention

Invoice Lifecycle

```
Draft
   ↓
Confirmed
   ↓
Paid
```

---

## Payment Management

- Record Payments
- Multiple Payment Methods
- Payment Notes
- Outstanding Balance
- Payment History
- Invoice Mapping

---

## Tax & Discount Engine

Taxes

- Create Tax Rules
- Product-wise Taxes
- Automatic Tax Calculation

Discounts

- Fixed Discounts
- Percentage Discounts
- Validity
- Usage Limits
- Automatic Discount Application

---

## Dashboard & Reports

Finance Dashboard

- Active Subscriptions
- Revenue
- Outstanding Payments
- Overdue Invoices
- Payments Received
- Revenue Charts
- Subscription Analytics

---

## Customer Portal

Customers can

- View Subscriptions
- View Invoices
- Download PDFs
- Payment History
- Update Profile
- Renewal Request
- Cancellation Request

---

# User Roles

| Role | Permissions |
|-------|-------------|
| Admin | Full System Access |
| Staff | Customer, Subscription & Billing Operations |
| Customer | View Own Subscriptions & Invoices |

---

# Tech Stack

## Frontend

- React JSX
- React Router
- CSS
- Axios

## Backend

- Supabase
- Supabase Auth
- Edge Functions (if required)

## Database

- PostgreSQL (Supabase)

## Authentication

- Supabase Authentication

## Deployment

- Vercel *(Frontend)*
- Supabase *(Backend & Database)*

---

# System Architecture

```text
                ┌──────────────┐
                │   React App  │
                └──────┬───────┘
                       │
             REST / Supabase APIs
                       │
        ┌──────────────┴──────────────┐
        │                             │
 Authentication                Business Logic
        │                             │
        └──────────────┬──────────────┘
                       │
                Supabase Database
                       │
      Products → Plans → Subscriptions
                       │
          Invoices → Payments → Reports
```

---

# Project Structure

```
BrightLoop/

│
├── client/
│
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │
│   ├── authentication/
│   ├── products/
│   ├── plans/
│   ├── customers/
│   ├── quotations/
│   ├── subscriptions/
│   ├── invoices/
│   ├── payments/
│   ├── reports/
│   └── customerPortal/
│
├── supabase/
│
├── database/
│
├── assets/
│
└── README.md
```

---

# Major Modules

- Authentication
- Product Management
- Subscription Plans
- Customer Management
- Quotations
- Subscription Management
- Invoice Management
- Payment Management
- Tax Management
- Discount Management
- Dashboard
- Reports
- Customer Portal

---

# Workflow

```
Admin

↓

Create Product

↓

Create Plan

↓

Staff

↓

Create Customer

↓

Create Quotation

↓

Customer Accepts

↓

Subscription Created

↓

Billing Date Arrives

↓

Invoice Generated

↓

Payment Recorded

↓

Dashboard Updated
```

---

# Installation

Clone repository

```bash
git clone <repository-link>
```

Navigate

```bash
cd BrightLoop
```

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

---

#  Environment Variables

Create

```
.env
```

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL

VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
```

---

# Screenshots

## Dashboard

---

## Products

---

## Subscription Management

---

## Invoice Generation

---

## Customer Portal

---

# Team

| Member | Responsibility | Github | LinkedIn |
|----------|----------------|-----------|----------|
| **Chris Thomas Abraham** | x | [ChrisToms14](https://github.com/ChrisToms14) | [Chris Thomas Abraham](https://www.linkedin.com/in/christhomasabraham/) |
| **Niranj R** | x | [Niranj R](https://github.com/niranj-r) | [Niranj R](https://www.linkedin.com/in/niranj-r/) |
| **Sradhya Renish** | x | [Sradhya9](https://github.com/sradhya9) | [Sradhya Renish](https://www.linkedin.com/in/sradhya-renish/) |
| **Vedha Mahadevan** | x | [Vedha17Mahadevan](https://github.com/Vedha17Mahadevan) | [Vedha Mahadevan](https://www.linkedin.com/in/vedha-mahadevan/) |

---

# Future Scope

- Payment Gateway Integration
- Email Notifications
- Automated Billing Scheduler
- Revenue Forecasting
- Multi-Currency Support
- Multi-Tenant Support
- Mobile Application
- Audit Logs
- API Documentation

---

# Performance Goals

- Response time under **2 seconds**
- Efficient pagination
- Optimized database queries
- Secure authentication
- Duplicate invoice prevention

---

# References

- Supabase Documentation
- React Documentation
- PostgreSQL Documentation

---

# Demo

Repository

> [Odoo Makeathon](https://github.com/niranj-r/odoo-makeathon/)

Live Demo

> 

Presentation

> 

Demo Video

> 

---

# License

This project was developed as part of a Hackathon.

MIT License.

---

<div align="center">

### BrightLoop

**Automating Subscription Businesses, One Billing Cycle at a Time.**

</div>
