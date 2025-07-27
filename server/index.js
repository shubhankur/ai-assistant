const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://shubhankur99:jqY8rsaVZMICWnyi@cluster0.gs0iosz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Schemas
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  age: Number,
  email: String,
  phone: String,
  address: String,
  occupation: String,
  created_at: { type: Date, default: Date.now },
});

const DailyPlanSchema = new Schema({
  userid: { type: Schema.Types.ObjectId, ref: 'User' },
  date: String,
  week_day: String,
  timezone: String,
  version: Number,
  created_at: { type: Date, default: Date.now },
  blocks: [
    {
      start: String,
      end: String,
      name: String,
      category: String,
      location: String,
      details: String,
    },
  ],
});

const EventSchema = new Schema({
  activity: String,
  start: String,
  end: String,
  approx: String,
  flexible: Boolean,
  category: String,
  location: String,
  details: String,
});

const CurrentRoutineSchema = new Schema({
  userid: { type: Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  created_at: { type: Date, default: Date.now },
  Monday: [EventSchema],
  Tuesday: [EventSchema],
  Wednesday: [EventSchema],
  Thursday: [EventSchema],
  Friday: [EventSchema],
  Saturday: [EventSchema],
  Sunday: [EventSchema],
});

const UserDesiredHabitChangesSchema = new Schema({
  userid: { type: Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  created_at: { type: Date, default: Date.now },
  goals: [String],
  lifestyle_changes: [String],
  activities_to_add: [String],
  activities_to_remove: [String],
});

const SuggestionSchema = new Schema({
  suggestion: String,
  reason: String,
  targets: String,
});

const UserOngoingChangesSchema = new Schema({
  userid: { type: Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  created_at: { type: Date, default: Date.now },
  HIGH_PRIORITY: [SuggestionSchema],
  MEDIUM_PRIORITY: [SuggestionSchema],
  LOW_PRIORITY: [SuggestionSchema],
});

const WeeklyRoutineSchema = new Schema({
  userid: { type: Schema.Types.ObjectId, ref: 'User' },
  timezone: String,
  date: String,
  created_at: { type: Date, default: Date.now },
  days: [
    {
      day: String,
      blocks: [
        {
          start: String,
          end: String,
          name: String,
          category: String,
          location: String,
          details: String,
        },
      ],
    },
  ],
});

// Models
const User = mongoose.model('User', UserSchema);
const DailyPlan = mongoose.model('DailyPlan', DailyPlanSchema);
const CurrentRoutine = mongoose.model('CurrentRoutine', CurrentRoutineSchema);
const UserDesiredHabitChanges = mongoose.model('UserDesiredHabitChanges', UserDesiredHabitChangesSchema);
const UserOngoingChanges = mongoose.model('UserOngoingChanges', UserOngoingChangesSchema);
const WeeklyRoutine = mongoose.model('WeeklyRoutine', WeeklyRoutineSchema);

// CRUD Helpers
function crudRoutes(model, path) {
  const router = express.Router();
  router.post('/', async (req, res) => {
    try {
      const doc = await model.create(req.body);
      res.status(201).json(doc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const doc = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const doc = await model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

app.use('/users', crudRoutes(User, 'users'));
app.use('/dailyPlans', crudRoutes(DailyPlan, 'dailyPlans'));
app.use('/currentRoutines', crudRoutes(CurrentRoutine, 'currentRoutines'));
app.use('/desiredHabitChanges', crudRoutes(UserDesiredHabitChanges, 'desiredHabitChanges'));
app.use('/ongoingChanges', crudRoutes(UserOngoingChanges, 'ongoingChanges'));
app.use('/weeklyRoutines', crudRoutes(WeeklyRoutine, 'weeklyRoutines'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // for testing
