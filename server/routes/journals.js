const express = require('express');
const Journal = require('../models/journal');

const router = express.Router();

// Save a new journal (creates new version if one already exists for date)
router.post('/save', async (req, res) => {
  try {
    // Attach authenticated user id
    const journalData = { ...req.body, userid: req.user._id };

    // Find latest existing journal for this user & date to determine version
    const existing = await Journal.findOne({
      userid: req.user._id,
      date: journalData.date
    }).sort({ version: -1 });

    if (existing) {
      journalData.version = (existing.version || 0) + 1;
    }

    const doc = await Journal.create(journalData);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Fetch latest journal for a given date (by authenticated user)
router.get('/fetchByDate', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query parameter required' });
    }

    const doc = await Journal.findOne({
      userid: req.user._id,
      date: date
    }).sort({ version: -1 });

    if (!doc) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
