const express = require('express');
const internalAuth = require('../middleware/internalAuth');

const DailyPlan = require('../models/dailyPlan');
const CurrentRoutine = require('../models/currentRoutine');
const DesiredHabitChange = require('../models/userDesiredHabitChanges');
const OngoingChange = require('../models/userOngoingChanges');
const WeeklyRoutine = require('../models/weeklyRoutine');

const router = express.Router();

// Protect all routes with internal auth
router.use(internalAuth);

// ---- Daily Plans ----
router.post('/dailyPlans/save', async (req, res) => {
  try {
    // Add user ID from authenticated user
    const dailyPlanData = req.body;
    // Check if plan already exists for this user and date
    const existingPlan = await DailyPlan.findOne({
      userid: dailyPlanData.userid,
      date: dailyPlanData.date
    });

    if (existingPlan) {
      // Increment version number
      dailyPlanData.version = (existingPlan.version || 0) + 1;
    }
    // Create new document with version number
    const doc = await DailyPlan.create(dailyPlanData);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ---- Current Routine ----
router.post('/currentRoutines/save', async (req, res) => {
  try {
    const doc = await CurrentRoutine.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ---- Desired Habit Changes ----
router.post('/desiredHabitChanges/save', async (req, res) => {
  try {
    const doc = await DesiredHabitChange.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ---- Ongoing Changes ----
router.post('/ongoingChanges/save', async (req, res) => {
  try {
    const doc = await OngoingChange.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ---- Weekly Routines ----
router.post('/weeklyRoutines/save', async (req, res) => {
  try {
    const doc = await WeeklyRoutine.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ---- Get Latest Weekly Routine ----
router.get('/weeklyRoutines/get', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const doc = await WeeklyRoutine.findOne({ userid: userId })
      .sort({ createdAt: -1 }); // Sort by creation date descending to get most recent
    
    if (!doc) {
      return res.status(404).json({ error: 'No weekly routine found for this user' });
    }
    
    return res.status(200).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router; 