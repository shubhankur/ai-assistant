const mongoose = require('../db');

const JournalSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,          // ISO YYYY-MM-DD
  week_day: String,      // e.g. Monday
  time: String,          // HH:MM or ISO time string
  timezone: String,      // IANA timezone name
  locale: String,        // e.g. en-US
  summary: String,
  appreciation: [String],
  improvements: [String],
  version: Number,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Journal', JournalSchema);
