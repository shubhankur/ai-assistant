const express = require('express');
const DailyPlan = require('../models/dailyPlan');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const doc = await DailyPlan.create(req.body);
    res.status(201).json(doc);
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

router.get('/user/:userid', async (req, res) => {
  try {
    const docs = await DailyPlan.find({ userid: req.params.userid });
    res.json(docs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/user/:userid/date/:date', async (req, res) => {
  try {
    const doc = await DailyPlan.findOne({ userid: req.params.userid, date: req.params.date });
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
