const mongoose = require('../db');

const EventSchema = new mongoose.Schema({
  activity: String,
  start: String,
  end: String,
  approx: String,
  flexible: Boolean,
  category: String,
  location: String,
  details: String,
});

const CurrentRoutineSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  created_at: { type: Date, default: Date.now },
  Monday: [EventSchema],
  Tuesday: [EventSchema],
  Wednesday: [EventSchema],
  Thursday: [EventSchema],
  Friday: [EventSchema],
  Saturday: [EventSchema],
  Sunday: [EventSchema],
});

module.exports = mongoose.model('CurrentRoutine', CurrentRoutineSchema);
