const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');
const sgMail = require('@sendgrid/mail')
const crypto = require('crypto');
const cookieParser = require('cookie');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const SECRET = process.env.SECRET_KEY || 'secret';
const KEY = crypto.createHash('sha256').update(String(SECRET)).digest();
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', KEY, iv);
  const enc = Buffer.concat([cipher.update(text), cipher.final()]);
  return Buffer.concat([iv, enc]).toString('base64url');
}
function decrypt(data) {
  const buf = Buffer.from(data, 'base64url');
  const iv = buf.subarray(0, 16);
  const enc = buf.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-ctr', KEY, iv);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString();
}

async function send_verification_email(to, code) {
  const msg = {
    to: to,
    from: process.env.SMTP_USER,
    subject: 'Verify your account',
    text: `Your verification code is ${code}`,
  };
  
  try {
    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    let user = await User.findOne({ email });
    if (user) {
      if (user.password !== password) {
        console.warn('Login wrong password for', email);
        return res.status(401).json({ error: 'Wrong password' });
      }
      if (!user.verified) {
        let code = user.verificationCode;
        if (!code || !user.verification_code_expiry || user.verification_code_expiry < Date.now()) {
          code = Math.floor(100000 + Math.random() * 900000).toString();
          user.verificationCode = code;
          user.verification_code_expiry = Date.now() + 10 * 60 * 1000;
          await send_verification_email(email, code);
        }
        await user.save();
        res.cookie('user', encrypt(String(user._id)), { httpOnly: true });
        return res.json({ message: 'verification_required' });
      }
      res.cookie('user', encrypt(String(user._id)), { httpOnly: true });
      return res.json(user);
    }
    const name = email.split('@')[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user = await User.create({
      email,
      password,
      name,
      verificationCode: code,
      verification_code_expiry: Date.now() + 10 * 60 * 1000,
    });
    console.log('User created', user._id);
    await send_verification_email(email, code);
    res.cookie('user', encrypt(String(user._id)), { httpOnly: true });
    res.json({ message: 'verification_required' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body;
    const parsed = req.headers.cookie ? cookieParser.parse(req.headers.cookie) : {};
    const cookie = parsed.user;
    if (!cookie) return res.status(401).json({ error: 'No cookie' });
    const id = decrypt(cookie);
    const user = await User.findById(id);
    if (!user) {
      console.warn('Verify failed - user not found:', id);
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.verification_code_expiry && user.verification_code_expiry < Date.now()) {
      return res.status(400).json({ error: 'Code expired' });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    user.verified = true;
    user.verificationCode = undefined;
    user.verification_code_expiry = undefined;
    await user.save();
    res.cookie('user', encrypt(String(user._id)), { httpOnly: true });
    res.json({ message: 'verified', stage: user.stage, id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.warn('Forgot password - user not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }
    let code = user.verificationCode;
    if (!code || !user.verification_code_expiry || user.verification_code_expiry < Date.now()) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = code;
      user.verification_code_expiry = Date.now() + 10 * 60 * 1000;
      await user.save();
      await send_verification_email(email, code);
    }
    res.json({ message: 'reset_code_sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.warn('Reset password - user not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.verificationCode !== code) return res.status(400).json({ error: 'Invalid code' });
    user.password = password;
    user.verificationCode = undefined;
    await user.save();
    res.cookie('user', encrypt(String(user._id)), { httpOnly: true });
    res.json({ message: 'password_reset', stage: user.stage, id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Reset password error:', err);
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
    res.cookie('user', encrypt(String(user._id)), { httpOnly: true });
    res.json(user);
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(400).json({ error: 'Google auth failed' });
  }
});

router.get('/validate', async (req, res) => {
  try {
    const parsed = req.headers.cookie ? cookieParser.parse(req.headers.cookie) : {};
    const cookie = parsed.user;
    if (!cookie) return res.status(401).json({ error: 'No cookie' });
    const id = decrypt(cookie);
    const user = await User.findById(id);
    if (!user) {
      console.warn('Validate - user not found:', id);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: user._id, name: user.name, email: user.email, stage: user.stage, verified: user.verified });
  } catch (err) {
    console.error('Validate error:', err);
    res.status(400).json({ error: 'Invalid cookie' });
  }
});

// Public endpoint to verify user exists by ID (for worker verification)
router.get('/verify-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      console.warn('verify-user: no user for id', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      exists: true, 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      stage: user.stage 
    });
  } catch (err) {
    console.error('verify-user error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/resend-code', async (req, res) => {
  try {
    const parsed = req.headers.cookie ? cookieParser.parse(req.headers.cookie) : {};
    const cookie = parsed.user;
    if (!cookie) return res.status(401).json({ error: 'No cookie' });
    const id = decrypt(cookie);
    const user = await User.findById(id);
    if (!user) {
      console.warn('resend-code: no user for id', id);
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.verified) return res.json({ message: 'already_verified' });

    let code = user.verificationCode;
    if (!code || !user.verification_code_expiry || user.verification_code_expiry < Date.now()) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = code;
      user.verification_code_expiry = Date.now() + 10 * 60 * 1000;
      await user.save();
      await send_verification_email(user.email, code);
    }
    res.json({ message: 'verification_sent' });
  } catch (err) {
    console.error('resend-code error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('user');
  res.json({ message: 'logged_out' });
});

module.exports = router;
