require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
require('./db');

const users = require('./routes/users');
const dailyPlans = require('./routes/dailyPlans');
const currentRoutines = require('./routes/currentRoutines');
const desiredHabitChanges = require('./routes/desiredHabitChanges');
const ongoingChanges = require('./routes/ongoingChanges');
const weeklyRoutines = require('./routes/weeklyRoutines');
const auth = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const internalRoutes = require('./routes/internal');

const cors = require('cors'); 

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));

// Add simple request/response logging middleware for all routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - request received`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - response sent with status ${res.statusCode}`);
  });
  next();
});

// Public routes (no authentication required)
app.use('/auth', auth);

// Internal service-to-service routes (API-key auth)
app.use('/internal', internalRoutes);

// Protected routes (authentication required)
app.use('/users', authMiddleware, users);
app.use('/dailyPlans', authMiddleware, dailyPlans);
app.use('/currentRoutines', authMiddleware, currentRoutines);
app.use('/desiredHabitChanges', authMiddleware, desiredHabitChanges);
app.use('/ongoingChanges', authMiddleware, ongoingChanges);
app.use('/weeklyRoutines', authMiddleware, weeklyRoutines);


const PORT = 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
