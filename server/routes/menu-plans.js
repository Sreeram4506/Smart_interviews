const express = require('express');
const jwt = require('jsonwebtoken');
const MenuPlan = require('../models/MenuPlan');
const MenuSelection = require('../models/MenuSelection');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'messpulse_jwt_secret_key_2024';
const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];

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

function normalizeServiceDate(value) {
  if (!value) return null;
  const str = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
}

function enrichPlans(plans, selections, user) {
  const selectionList = selections || [];
  return plans.map((plan) => {
    const planSelections = selectionList.filter((item) => String(item.menuPlanId) === String(plan._id));
    const optionCounts = plan.options.map((option) => ({
      optionId: String(option._id),
      count: planSelections.filter((item) => String(item.selectedOptionId) === String(option._id)).length,
    }));
    const mySelection = user?.role === 'student'
      ? planSelections.find((item) => String(item.studentId) === String(user._id))
      : null;

    return {
      ...plan,
      optionCounts,
      totalSelections: planSelections.length,
      mySelection: mySelection
        ? {
            selectedOptionId: mySelection.selectedOptionId,
            selectedOptionLabel: mySelection.selectedOptionLabel,
            selectedOptionDescription: mySelection.selectedOptionDescription,
          }
        : null,
    };
  });
}

router.get('/', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const requestedDate = normalizeServiceDate(req.query.date);
    const serviceDate =
      requestedDate ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const plans = await MenuPlan.find({ serviceDate })
      .sort({ mealType: 1, createdAt: -1 })
      .lean();

    const planIds = plans.map((plan) => plan._id);
    const selections = planIds.length
      ? await MenuSelection.find({ menuPlanId: { $in: planIds } }).lean()
      : [];

    res.json({ serviceDate, plans: enrichPlans(plans, selections, user) });
  } catch (err) {
    console.error('Menu plan fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (user.role !== 'mess_owner') {
    return res.status(403).json({ error: 'Only mess_owner can create menu plans' });
  }

  try {
    const {
      serviceDate,
      mealType,
      title = '',
      description = '',
      options = [],
    } = req.body || {};

    const normalizedDate = normalizeServiceDate(serviceDate);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'serviceDate must be in YYYY-MM-DD format' });
    }

    if (!MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ error: 'mealType must be breakfast, lunch, snacks, or dinner' });
    }

    const normalizedOptions = Array.isArray(options)
      ? options
          .map((option) => ({
            label: String(option?.label || '').trim(),
            description: String(option?.description || '').trim(),
            imageDataUrl: option?.imageDataUrl || null,
          }))
          .filter((option) => option.label)
      : [];

    if (normalizedOptions.length < 2) {
      return res.status(400).json({ error: 'At least two options are required' });
    }

    const menuPlan = await MenuPlan.create({
      ownerId: user._id,
      ownerRole: user.role,
      serviceDate: normalizedDate,
      mealType,
      title: title.trim(),
      description: description.trim(),
      options: normalizedOptions,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('menu-plan-update', {
        type: 'menu-plan',
        message: `${mealType} menu options published for ${normalizedDate}`,
        menuPlan,
      });
    }

    res.status(201).json({ menuPlan });
  } catch (err) {
    console.error('Menu plan create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:planId/select', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can select a menu option' });
  }

  try {
    const { planId } = req.params;
    const { optionId } = req.body || {};

    const menuPlan = await MenuPlan.findById(planId);
    if (!menuPlan) {
      return res.status(404).json({ error: 'Menu plan not found' });
    }

    const selectedOption = menuPlan.options.id(optionId);
    if (!selectedOption) {
      return res.status(400).json({ error: 'Selected option not found' });
    }

    const selection = await MenuSelection.findOneAndUpdate(
      { menuPlanId: menuPlan._id, studentId: user._id },
      {
        menuPlanId: menuPlan._id,
        studentId: user._id,
        studentName: user.name || user.username,
        studentUsername: user.username,
        serviceDate: menuPlan.serviceDate,
        mealType: menuPlan.mealType,
        selectedOptionId: selectedOption._id,
        selectedOptionLabel: selectedOption.label,
        selectedOptionDescription: selectedOption.description || '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('menu-selection-update', {
        type: 'menu-selection',
        message: `${selection.studentName} selected ${selection.selectedOptionLabel}`,
        selection,
      });
    }

    res.json({ selection });
  } catch (err) {
    console.error('Menu selection error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/owner/summary', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (user.role !== 'mess_owner') {
    return res.status(403).json({ error: 'Only mess_owner can view menu summaries' });
  }

  try {
    const requestedDate = normalizeServiceDate(req.query.date);
    const serviceDate =
      requestedDate ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const plans = await MenuPlan.find({ serviceDate })
      .sort({ mealType: 1, createdAt: -1 })
      .lean();

    const planIds = plans.map((plan) => plan._id);
    const selections = planIds.length
      ? await MenuSelection.find({ menuPlanId: { $in: planIds } }).lean()
      : [];

    res.json({ serviceDate, plans: enrichPlans(plans, selections, user), selections });
  } catch (err) {
    console.error('Menu summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
