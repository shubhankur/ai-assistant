const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const doc = await User.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    if (req.query.email) {
      const doc = await User.findOne({ email: req.query.email });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json(doc);
    }
    if (req.query.phone) {
      const doc = await User.findOne({ phone: req.query.phone });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json(doc);
    }
    const docs = await User.find();
    res.json(docs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await User.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const doc = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/stage/update', async (req, res) => {
  try {
    const { stage } = req.body;
    if (typeof stage !== 'number') {
      return res.status(400).json({ error: 'Stage must be a number' });
    }

    // Get user ID from middleware
    const userId = req.user._id;

    const doc = await User.findByIdAndUpdate(
      userId,
      { stage },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'User not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



router.delete('/:id', async (req, res) => {
  try {
    const doc = await User.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
