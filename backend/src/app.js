import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
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
      customers: '/api/customers',
      quotationTemplates: '/api/quotation-templates',
      quotations: '/api/quotations',
      subscriptions: '/api/subscriptions',
      adminJobs: '/api/admin/jobs'
    }
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', customerRoutes);
app.use('/api', templateRoutes);
app.use('/api', quotationRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', jobRoutes);

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
