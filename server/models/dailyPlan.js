const mongoose = require('../db');

const DailyPlanSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  week_day: String,
  timezone: String,
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
    },
  ],
});

module.exports = mongoose.model('DailyPlan', DailyPlanSchema);
