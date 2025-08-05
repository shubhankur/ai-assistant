const express = require('express');
const Slot = require('../models/slot');
const DailyPlan = require('../models/dailyPlan');

const router = express.Router();

router.get('/:dailyPlanId', async (req, res) => {
  try {
    const slots = await Slot.find({ dailyPlanId: req.params.dailyPlanId });
    res.json(slots);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { dailyPlanId, start, end, name, category, completed } = req.body;
    const slot = await Slot.findOneAndUpdate(
      { dailyPlanId, start },
      { dailyPlanId, start, end, name, category, completed },
      { new: true, upsert: true }
    );
    if (completed !== undefined) {
      await DailyPlan.updateOne(
        { _id: dailyPlanId, 'blocks.start': start },
        { $inc: { 'blocks.$.completed_slots': completed ? 1 : -1 } }
      );
    }
    res.json(slot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
