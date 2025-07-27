const mongoose = require('../db');

const UserSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  phone: String,
  address: String,
  occupation: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
