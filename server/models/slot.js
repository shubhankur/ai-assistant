const mongoose = require('../db');

const SlotSchema = new mongoose.Schema({
  dailyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyPlan' },
  start: String,
  end: String,
  name: String,
  category: String,
  location: String,
  details: String,
  groupId: String,
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Slot', SlotSchema);
