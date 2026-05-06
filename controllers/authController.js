// =============================================================
// controllers/authController.js
// Handles user registration and login logic
// =============================================================

import bcrypt    from 'bcryptjs';
import jwt       from 'jsonwebtoken';
import pool      from '../config/database.js';

// ─── Helpers ──────────────────────────────────────────────────

/** Validate email format using a robust regex */
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validate password strength:
 *   - At least 8 characters
 *   - Contains at least one letter and one number
 */
const isStrongPassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

// ─── Register ─────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account with a bcrypt-hashed password.
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required: username, email, password.',
      });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({
        message: 'Username must be at least 3 characters long.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and contain at least one letter and one number.',
      });
    }

    // ── Check for duplicate username / email ──────────────────
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email.toLowerCase(), username.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'A user with that email or username already exists.',
      });
    }

    // ── Hash password (salt rounds = 10) ──────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Insert user into database ─────────────────────────────
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase(), hashedPassword]
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id:       result.insertId,
        username: username.trim(),
        email:    email.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('[register] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Login ────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates a user and returns a signed JWT token.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // ── Fetch user from DB ────────────────────────────────────
    const [rows] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      // Use a generic message to avoid leaking whether the email exists
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // ── Verify password against stored hash ───────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Sign JWT with user identity ───────────────────────────
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:       user.id,
        username: user.username,
        email:    user.email,
      },
    });
  } catch (error) {
    console.error('[login] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
