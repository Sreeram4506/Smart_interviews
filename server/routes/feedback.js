const express = require('express');
const jwt = require('jsonwebtoken');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'messpulse_jwt_secret_key_2024';

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

async function requireUser(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username role name');
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

router.post('/', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit feedback' });
  }

  try {
    const { menuItemId = null, menuItemName, rating, description = '' } = req.body || {};

    if (!menuItemName) {
      return res.status(400).json({ error: 'menuItemName is required' });
    }

    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    const feedback = await Feedback.create({
      studentId: user._id,
      studentName: user.name || user.username,
      studentUsername: user.username,
      menuItemId,
      menuItemName,
      rating: normalizedRating,
      description,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('feedback-update', {
        type: 'feedback',
        feedback,
        message: `${feedback.studentName} rated ${feedback.menuItemName} ${feedback.rating}/5`,
      });
    }

    res.status(201).json({ feedback });
  } catch (err) {
    console.error('Feedback create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (user.role !== 'mess_owner') {
    return res.status(403).json({ error: 'Only mess_owner can view feedback' });
  }

  try {
    const feedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ feedback });
  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
