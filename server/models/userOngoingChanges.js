const mongoose = require('../db');

const SuggestionSchema = new mongoose.Schema({
  suggestion: String,
  reason: String,
  targets: String,
});

const UserOngoingChangesSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  created_at: { type: Date, default: Date.now },
  HIGH_PRIORITY: [SuggestionSchema],
  MEDIUM_PRIORITY: [SuggestionSchema],
  LOW_PRIORITY: [SuggestionSchema],
});

module.exports = mongoose.model('UserOngoingChanges', UserOngoingChangesSchema);
