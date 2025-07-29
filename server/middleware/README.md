# Authentication Middleware

This middleware handles user authentication by decrypting cookies and attaching the user object to the request.

## How it works

1. **Cookie Parsing**: Extracts the `user` cookie from request headers
2. **Decryption**: Decrypts the cookie using AES-256-CTR encryption with the SECRET_KEY
3. **User Lookup**: Finds the user in the database using the decrypted user ID
4. **Request Enhancement**: Attaches the user object to `req.user` for use in route handlers

## Usage

### In route handlers
Once the middleware is applied, you can access the authenticated user:

```javascript
router.get('/profile', authMiddleware, (req, res) => {
  // req.user contains the full user object from the database
  const userId = req.user._id;
  const userEmail = req.user.email;
  const userName = req.user.name;
  
  res.json({ user: req.user });
});
```

### Applying middleware to routes
In `index.js`, the middleware is applied to protected routes:

```javascript
// Public routes (no authentication required)
app.use('/auth', auth);

// Protected routes (authentication required)
app.use('/users', authMiddleware, users);
app.use('/dailyPlans', authMiddleware, dailyPlans);
// ... other protected routes
```

## Error Handling

The middleware returns appropriate error responses:
- `401` if no cookie is found
- `401` if the user is not found in the database
- `401` if the cookie is invalid or corrupted

## Security

- Uses AES-256-CTR encryption for cookie security
- Requires the `SECRET_KEY` environment variable
- Cookies are httpOnly for additional security
- User objects are validated against the database on each request 