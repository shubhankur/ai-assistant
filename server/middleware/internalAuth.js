const crypto = require('crypto');

// Internal API key used for service-to-service calls (set in env).
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'your-secret-internal-key';

/**
 * Middleware that authenticates internal service calls using a static API key.
 * The caller must:
 *  - send `Authorization: Bearer <INTERNAL_API_KEY>` header
 *  - include `userid` in the JSON body (so we can attach req.user for model hooks)
 */
module.exports = async function internalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Internal API key required' });
    }

    const apiKey = authHeader.slice(7);
    if (apiKey !== INTERNAL_API_KEY) {
      return res.status(401).json({ error: 'Invalid internal API key' });
    }

    const { userid } = req.body;
    if (!userid) {
      return res.status(400).json({ error: 'userid required in request body' });
    }

    // Attach minimal user object so downstream routes can use req.user._id
    req.user = { _id: userid };
    return next();
  } catch (err) {
    console.error('Internal auth middleware error:', err);
    return res.status(401).json({ error: 'Internal authentication failed' });
  }
}; 