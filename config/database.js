// =============================================================
// config/database.js
// MySQL connection pool configuration using mysql2/promise
// =============================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create a MySQL connection pool.
 * Using a pool is more efficient than creating a new connection
 * for every query — it reuses existing connections automatically.
 */
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'task_manager',
  waitForConnections: true,   // Queue requests when pool is exhausted
  connectionLimit:    10,     // Max simultaneous connections
  queueLimit:         0,      // Unlimited queue (0 = no limit)
  timezone: '+00:00',         // Use UTC for consistent timestamps
});

/**
 * Test the database connection on startup.
 * Logs a success or error message to the console.
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅  MySQL connected successfully');
    connection.release(); // Always release connections back to the pool
  } catch (error) {
    console.error('❌  MySQL connection failed:', error.message);
    process.exit(1); // Exit the process — the API cannot run without a DB
  }
};

/**
 * Initialize database tables if they don't already exist.
 * Call this once on server startup to ensure schema is in place.
 */
export const initializeDatabase = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id         INT           NOT NULL AUTO_INCREMENT,
      username   VARCHAR(255)  NOT NULL,
      email      VARCHAR(255)  NOT NULL,
      password   VARCHAR(255)  NOT NULL,
      created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_username (username),
      UNIQUE KEY uq_email    (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createTasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id          INT                                      NOT NULL AUTO_INCREMENT,
      user_id     INT                                      NOT NULL,
      title       VARCHAR(255)                             NOT NULL,
      description TEXT,
      status      ENUM('pending','in_progress','completed') DEFAULT 'pending',
      priority    ENUM('low','medium','high')               DEFAULT 'medium',
      due_date    DATE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.execute(createUsersTable);
    await pool.execute(createTasksTable);
    console.log('✅  Database tables initialized');
  } catch (error) {
    console.error('❌  Failed to initialize tables:', error.message);
    process.exit(1);
  }
};

export default pool;
