const express = require('express');
const jwt = require('jsonwebtoken');
const Menu = require('../models/Menu');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'messpulse_jwt_secret_key_2024';

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

function requireUser(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

// ── Create menu item (owner) ───────────────────────────
router.post('/menu', async (req, res) => {
  const decoded = requireUser(req, res);
  if (!decoded) return;

  try {
    if (decoded.role !== 'mess_owner') {
      return res.status(403).json({ error: 'Only mess_owner can create menu items' });
    }

    const { foodName, description, category, quantity, imageDataUrl } = req.body || {};

    if (!foodName) {
      return res.status(400).json({ error: 'foodName is required' });
    }

    const menu = await Menu.create({
      ownerId: decoded.id,
      ownerRole: decoded.role,
      name: foodName,
      description: description || '',
      category: category || '',
      quantity: quantity || '',
      imageDataUrl: imageDataUrl || null,
    });

    // Debug / verification logging (safe: no image content, only size)
    const imageSize = menu.imageDataUrl ? String(menu.imageDataUrl).length : 0;
    console.log('✅ menu saved:', {
      id: String(menu._id),
      name: menu.name,
      imageDataUrlLength: imageSize,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('menu-update', {
        type: 'menu',
        message: `${menu.name} menu item published`,
        menu,
      });
    }

    res.status(201).json({ menu });
  } catch (err) {
    console.error('Menu create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Fetch menu items (student + owner) ────────────────
router.get('/menu', async (req, res) => {
  const decoded = requireUser(req, res);
  if (!decoded) return;

  try {
    const menus = await Menu.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ menus });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
