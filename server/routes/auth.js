const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'messpulse_jwt_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ── Register ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    if (!['student', 'mess_owner'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "student" or "mess_owner"' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role,
      name: name || username,
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ── Login ────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normalizedUsername = username.toLowerCase();

    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      console.warn(`[auth/login] 401 user not found. username=${normalizedUsername}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    console.info(
      `[auth/login] compare result. username=${normalizedUsername} match=${isMatch}`
    );

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.password.startsWith('$2')) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get current user (verify token) ──────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: { id: user._id, username: user.username, role: user.role, name: user.name },
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
