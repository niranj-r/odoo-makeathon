import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';
<<<<<<< HEAD
import discountRoutes from './routes/discountRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import adminStaffRoutes from './routes/adminStaffRoutes.js';
import staffPortalRoutes from './routes/staffPortalRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import portalRoutes from './routes/portalRoutes.js';
=======
import taxRoutes from './routes/taxRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminStaffRoutes from './routes/adminStaffRoutes.js';
import staffPortalRoutes from './routes/staffPortalRoutes.js';
import { verifyAuth } from './middleware/auth.js';
import { requireRoles } from './middleware/roles.js';
import { listAllVariants } from './controllers/variantController.js';
>>>>>>> origin/master
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Documentation / Health Root
app.get('/', (req, res) => {
  res.json({
    name: 'Brightloop Subscription & Financial Management Platform API',
    version: '1.0.0',
    status: 'online',
    documentation: {
      health: '/api/health',
<<<<<<< HEAD
      auth: '/api/auth',
      products: '/api/products',
      subscriptionPlans: '/api/subscription-plans',
      discounts: '/api/discounts',
      taxes: '/api/taxes',
      staff: '/api/admin/staff',
      staffPortal: '/api/staff/portal',
      customers: '/api/customers',
      quotationTemplates: '/api/quotation-templates',
      quotations: '/api/quotations',
      subscriptions: '/api/subscriptions',
      adminJobs: '/api/admin/jobs',
      invoices: '/api/invoices',
      payments: '/api/payments',
      billingScheduler: '/api/admin/billing',
      emails: '/api/emails',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      reports: '/api/reports',
      portal: '/api/portal'
=======
      me: '/api/auth/me',
      staff: '/api/users/staff',
      products: '/api/products',
      variants: '/api/variants',
      subscriptionPlans: '/api/subscription-plans',
      taxes: '/api/taxes',
      discounts: '/api/discounts'
>>>>>>> origin/master
    }
  });
});

<<<<<<< HEAD
// Health Checks
app.use('/api/health', healthRoutes);

// Member 1 Routes: Auth, Catalog, Plans, Discounts, Taxes & Staff Management
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/staff/portal', staffPortalRoutes);

// Member 2 Routes: Customers, Quotation Templates, Quotations & Subscriptions
app.use('/api/customers', customerRoutes);
app.use('/api/quotation-templates', templateRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin/jobs', jobRoutes);

// Member 3 Routes: Invoices, Payments, Billing Engine & Emails
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/billing', billingRoutes);
app.use('/api/emails', emailRoutes);

// Member 4 Routes: Executive Dashboard, Analytics, Reports & Customer Portal
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/portal', portalRoutes);
=======
// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/staff', staffPortalRoutes);
app.get('/api/variants', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listAllVariants);
>>>>>>> origin/master

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
