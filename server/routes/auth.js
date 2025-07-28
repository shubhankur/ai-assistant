const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    let user = await User.findOne({ email });
    if (user) {
      if (user.password !== password) {
        return res.status(401).json({ error: 'Wrong password' });
      }
      res.cookie('user', JSON.stringify({ id: user._id, name: user.name, email: user.email }), { httpOnly: true });
      return res.json(user);
    }
    const name = email.split('@')[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user = await User.create({ email, password, name, verificationCode: code });
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Verify your account',
        text: `Your verification code is ${code}`,
      });
    } catch (e) {
      console.error('Mail error', e);
    }
    res.json({ message: 'verification_required' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    user.verified = true;
    user.verificationCode = undefined;
    await user.save();
    res.cookie('user', JSON.stringify({ id: user._id, name: user.name, email: user.email }), { httpOnly: true });
    res.json({ message: 'verified' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    await user.save();
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Password reset code',
        text: `Your password reset code is ${code}`,
      });
    } catch (e) {
      console.error('Mail error', e);
    }
    res.json({ message: 'reset_code_sent' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.resetCode !== code) return res.status(400).json({ error: 'Invalid code' });
    user.password = password;
    user.resetCode = undefined;
    await user.save();
    res.cookie('user', JSON.stringify({ id: user._id, name: user.name, email: user.email }), { httpOnly: true });
    res.json({ message: 'password_reset' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    let user = await User.findOne({ email });
    if (!user) {
      const name = email.split('@')[0];
      user = await User.create({ email, name, gauth: true, verified: true });
    }
    res.cookie('user', JSON.stringify({ id: user._id, name: user.name, email: user.email }), { httpOnly: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Google auth failed' });
  }
});

module.exports = router;
