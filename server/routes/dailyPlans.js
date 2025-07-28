const express = require('express');
const DailyPlan = require('../models/dailyPlan');

const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const doc = await DailyPlan.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    if (req.query.userid && req.query.date) {
      const doc = await DailyPlan.findOne({ userid: req.query.userid, date: req.query.date });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json(doc);
    }
    if (req.query.userid) {
      const docs = await DailyPlan.find({ userid: req.query.userid });
      return res.json(docs);
    }
    const docs = await DailyPlan.find();
    res.json(docs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await DailyPlan.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const doc = await DailyPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await DailyPlan.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
