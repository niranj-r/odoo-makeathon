import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
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
      staff: '/api/users/staff'
    }
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);

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

