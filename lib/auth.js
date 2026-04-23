'use strict';

const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');

const JWT_SECRET  = (process.env.JWT_SECRET || 'samsa-dev-secret').trim();
const JWT_EXPIRES = '7d';

// ─── Create a token for a user ───────────────────────────────────────────────
function createToken(user) {
  return jwt.sign(
    {
      userId:   user.id,
      email:    user.email,
      username: user.username,
      role:     user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─── Verify a token ──────────────────────────────────────────────────────────
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Hash a password ─────────────────────────────────────────────────────────
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// ─── Check a password against a hash ─────────────────────────────────────────
async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── Middleware: protect any route ───────────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }

  req.user = payload;
  next();
}

// ─── Middleware: admin only ───────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — admin access required' });
  }
  next();
}

// ─── Middleware: user can only access their own data ─────────────────────────
function requireSelf(req, res, next) {
  const requestedId = req.params.userId || req.params.id;
  if (req.user.userId !== requestedId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — you can only access your own data' });
  }
  next();
}

module.exports = {
  createToken,
  verifyToken,
  hashPassword,
  checkPassword,
  authenticate,
  requireAdmin,
  requireSelf,
};
