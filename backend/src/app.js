import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { verifyAuth } from './middleware/auth.js';
import { requireRoles } from './middleware/roles.js';
import { listAllVariants } from './controllers/variantController.js';
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
      variants: '/api/variants',
      subscriptionPlans: '/api/subscription-plans',
      taxes: '/api/taxes',
      discounts: '/api/discounts'
    }
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/variants', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listAllVariants);

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

