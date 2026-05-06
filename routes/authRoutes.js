// =============================================================
// routes/authRoutes.js
// Authentication routes — public (no JWT required)
// =============================================================

import { Router }            from 'express';
import { register, login }   from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register  → create a new account
router.post('/register', register);

// POST /api/auth/login     → authenticate and receive a JWT
router.post('/login', login);

export default router;
