const crypto = require('crypto');
const cookieParser = require('cookie');
const User = require('../models/user');

const SECRET = process.env.SECRET_KEY || 'secret';
const KEY = crypto.createHash('sha256').update(String(SECRET)).digest();

function decrypt(data) {
  const buf = Buffer.from(data, 'base64url');
  const iv = buf.subarray(0, 16);
  const enc = buf.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-ctr', KEY, iv);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString();
}

const authMiddleware = async (req, res, next) => {
  try {
    // Parse cookies from request headers
    const parsed = req.headers.cookie ? cookieParser.parse(req.headers.cookie) : {};
    const cookie = parsed.user;
    
    if (!cookie) {
      return res.status(401).json({ error: 'Authentication required - no cookie found' });
    }
    
    // Decrypt the cookie to get user ID
    const userId = decrypt(cookie);
    
    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required - user not found' });
    }
    
    // Attach the user to the request object
    req.user = user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication required - invalid cookie' });
  }
};

module.exports = authMiddleware; 