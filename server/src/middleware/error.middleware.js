// Global error handler — must be registered last in app.js
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}
