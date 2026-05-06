// =============================================================
// middleware/authMiddleware.js
// JWT authentication middleware for protected routes
// =============================================================

import jwt from 'jsonwebtoken';

/**
 * authenticate
 * Express middleware that validates a JWT token from the
 * Authorization header (Bearer scheme).
 *
 * On success  → attaches `req.user` and calls next()
 * On failure  → returns 401 Unauthorized
 */
const authenticate = (req, res, next) => {
  // 1. Extract the Authorization header
  const authHeader = req.headers['authorization'];

  // 2. Ensure the header exists and follows "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. No token provided or invalid format.',
      hint:    'Authorization: Bearer <your_token>',
    });
  }

  // 3. Isolate the token string
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verify token signature and expiry using the shared secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the decoded payload to the request object so
    //    downstream handlers can access user identity (id, email, etc.)
    req.user = decoded;

    next();
  } catch (error) {
    // Differentiate between an expired token and a truly invalid one
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

export default authenticate;
