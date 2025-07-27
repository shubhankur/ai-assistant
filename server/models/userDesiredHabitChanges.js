const mongoose = require('../db');

const UserDesiredHabitChangesSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  created_at: { type: Date, default: Date.now },
  goals: [String],
  lifestyle_changes: [String],
  activities_to_add: [String],
  activities_to_remove: [String],
});

module.exports = mongoose.model('UserDesiredHabitChanges', UserDesiredHabitChangesSchema);
