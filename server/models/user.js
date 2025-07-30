const mongoose = require('../db');

const UserSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  password: String,
  verified: { type: Boolean, default: false },
  gauth: { type: Boolean, default: false },
  phone: String,
  address: String,
  occupation: String,
  verificationCode: String,
  verification_code_expiry: Date,
  resetCode: String,
  stage: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
