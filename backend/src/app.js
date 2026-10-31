import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({
    name: 'Brightloop API',
    version: '1.0.0',
    description: 'Subscription Management Platform API',
    endpoints: {
      health: '/api/health',
      me: '/api/auth/me',
      staff: '/api/users/staff',
      products: '/api/products',
      subscriptionPlans: '/api/subscription-plans',
      customers: '/api/customers',
      quotationTemplates: '/api/quotation-templates',
      quotations: '/api/quotations',
      subscriptions: '/api/subscriptions',
      adminJobs: '/api/admin/jobs',
      invoices: '/api/invoices',
      payments: '/api/payments',
      billingScheduler: '/api/admin/billing',
      emails: '/api/emails'
    }
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api', customerRoutes);
app.use('/api', templateRoutes);
app.use('/api', quotationRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', jobRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/billing', billingRoutes);
app.use('/api/emails', emailRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
