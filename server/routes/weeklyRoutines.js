const express = require('express');
const Model = require('../models/weeklyRoutine');

const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const doc = await Model.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    if (req.user.id && req.query.date) {
      const docs = await Model.findOne({ userid: req.user.id, date: req.query.date }).sort({ created_at: -1 });
      if (!docs || docs.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(docs[0]); // Return the most recent one
    }
    if (req.user.id) {
      const docs = await Model.findOne({ userid: req.user.id }).sort({ created_at: -1 });
      return res.json(docs);
    }
    else {
      return res.status(400).json({ error: 'Missing userid parameter' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
