const mongoose = require('../db');

const WeeklyRoutineSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  date: String,
  created_at: { type: Date, default: Date.now },
  days: [
    {
      day: String,
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
    },
  ],
});

module.exports = mongoose.model('WeeklyRoutine', WeeklyRoutineSchema);
