/*
  GLOBAL ERROR HANDLER
  ────────────────────
  Must be registered LAST in app.js (after all routes).
  Express identifies it as an error handler because it has 4 parameters.

  Usage in controllers: call next(err) to route here instead of
  repeating try/catch + res.status(500) in every controller.
*/

const errorHandler = (err, req, res, next) => {
  // Log full error server-side (you'll see this in Railway logs)
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  // Don't leak stack traces to the client in production
  const isDev = process.env.NODE_ENV === 'development';

  // Handle known error types with specific status codes
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'A record with this value already exists.' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // Generic fallback
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on the server.',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = { errorHandler };
