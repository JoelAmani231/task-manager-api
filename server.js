// =============================================================
// server.js
// Entry point — configures Express app and starts the HTTP server
// =============================================================

import express   from 'express';
import cors      from 'cors';
import dotenv    from 'dotenv';
import { testConnection, initializeDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ────────────────────────────────────────

/**
 * CORS — allow requests from any origin in development.
 * Tighten this in production by specifying allowed origins:
 *   cors({ origin: 'https://yourfrontend.com' })
 */
app.use(cors({
  origin:  process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────

// Health-check endpoint — no auth required
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'OK',
    message:   'Task Manager API is running',
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
  });
});

// Mount API route groups
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────
// Must have 4 parameters for Express to recognise it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

// ─── Bootstrap ────────────────────────────────────────────────

const start = async () => {
  await testConnection();       // Confirm DB connectivity
  await initializeDatabase();   // Create tables if they don't exist
  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📋  Health check: http://localhost:${PORT}/health`);
  });
};

start();
