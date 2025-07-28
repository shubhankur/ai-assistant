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

const cors = require('cors'); 

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));


app.use('/users', users);
app.use('/dailyPlans', dailyPlans);
app.use('/currentRoutines', currentRoutines);
app.use('/desiredHabitChanges', desiredHabitChanges);
app.use('/ongoingChanges', ongoingChanges);
app.use('/weeklyRoutines', weeklyRoutines);
app.use('/auth', auth);


const PORT = 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
