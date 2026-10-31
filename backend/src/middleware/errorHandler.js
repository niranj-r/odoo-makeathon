/**
 * Centralized Express Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  console.error(' [Error]', err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle missing Supabase tables gracefully
  if (err.code === 'PGRST205' || (typeof message === 'string' && message.includes('schema cache'))) {
    statusCode = 503;
    message = 'Required database table has not been created yet in Supabase. Please run database/combined_member2_and_member3_migration.sql in your Supabase SQL Editor.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
