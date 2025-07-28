const mongoose = require('../db');

const EventSchema = new mongoose.Schema({
  start: String,
  end: String,
  name: String,
  category: String,
  location: String,
  details: String,
});

const WeeklyRoutineSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  date: String,
  locale: String,
  created_at: { type: Date, default: Date.now },
  Monday: [EventSchema],
  Tuesday: [EventSchema],
  Wednesday: [EventSchema],
  Thursday: [EventSchema],
  Friday: [EventSchema],
  Saturday: [EventSchema],
  Sunday: [EventSchema],
});

module.exports = mongoose.model('WeeklyRoutine', WeeklyRoutineSchema);
