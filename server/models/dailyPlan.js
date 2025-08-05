const mongoose = require('../db');

const DailyPlanSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  week_day: String,
  timezone: String,
  locale: String,
  version: Number,
  created_at: { type: Date, default: Date.now },
  blocks: [
    {
      start: String,
      end: String,
      name: String,
      category: String,
      location: String,
      details: String,
      groupId: String,
      completed_slots: { type: Number, default: 0 },
      total_slots: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model('DailyPlan', DailyPlanSchema);
