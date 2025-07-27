const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const mongoUri = 'mongodb+srv://shubhankur99:jqY8rsaVZMICWnyi@cluster0.gs0iosz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  phone: String,
  address: String,
  occupation: String,
  created_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const dailyPlanBlockSchema = new mongoose.Schema({
  start: String,
  end: String,
  name: String,
  category: String,
  location: String,
  details: String
}, { _id: false });

const dailyPlanSchema = new mongoose.Schema({
  userid: mongoose.Schema.Types.ObjectId,
  date: String,
  week_day: String,
  timezone: String,
  version: String,
  created_at: { type: Date, default: Date.now },
  blocks: [dailyPlanBlockSchema]
});
const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);

const routineEventSchema = new mongoose.Schema({
  activity: String,
  start: String,
  end: String,
  approx: String,
  flexible: Boolean,
  category: String,
  location: String,
  details: String
}, { _id: false });

const currentRoutineSchema = new mongoose.Schema({
  userid: mongoose.Schema.Types.ObjectId,
  timezone: String,
  created_at: { type: Date, default: Date.now },
  Monday: [routineEventSchema],
  Tuesday: [routineEventSchema],
  Wednesday: [routineEventSchema],
  Thursday: [routineEventSchema],
  Friday: [routineEventSchema],
  Saturday: [routineEventSchema],
  Sunday: [routineEventSchema]
});
const CurrentRoutine = mongoose.model('CurrentRoutine', currentRoutineSchema);

const userDesiredHabitChangesSchema = new mongoose.Schema({
  userid: mongoose.Schema.Types.ObjectId,
  timezone: String,
  created_at: { type: Date, default: Date.now },
  goals: [String],
  lifestyle_changes: [String],
  activities_to_add: [String],
  activities_to_remove: [String]
});
const UserDesiredHabitChanges = mongoose.model('UserDesiredHabitChanges', userDesiredHabitChangesSchema);

const suggestionSchema = new mongoose.Schema({
  suggestion: String,
  reason: String,
  targets: String
}, { _id: false });

const userOngoingChangesSchema = new mongoose.Schema({
  userid: mongoose.Schema.Types.ObjectId,
  timezone: String,
  created_at: { type: Date, default: Date.now },
  HIGH_PRIORITY: [suggestionSchema],
  MEDIUM_PRIORITY: [suggestionSchema],
  LOW_PRIORITY: [suggestionSchema]
});
const UserOngoingChanges = mongoose.model('UserOngoingChanges', userOngoingChangesSchema);

const weeklyRoutineBlockSchema = new mongoose.Schema({
  start: String,
  end: String,
  name: String,
  category: String,
  location: String,
  details: String
}, { _id: false });

const weeklyRoutineDaySchema = new mongoose.Schema({
  day: String,
  blocks: [weeklyRoutineBlockSchema]
}, { _id: false });

const weeklyRoutineSchema = new mongoose.Schema({
  userid: mongoose.Schema.Types.ObjectId,
  timezone: String,
  date: String,
  created_at: { type: Date, default: Date.now },
  days: [weeklyRoutineDaySchema]
});
const WeeklyRoutine = mongoose.model('WeeklyRoutine', weeklyRoutineSchema);

function crudRoutes(Model) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!item) return res.status(404).send();
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).send();
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

app.use('/users', crudRoutes(User));
app.use('/dailyplans', crudRoutes(DailyPlan));
app.use('/currentroutines', crudRoutes(CurrentRoutine));
app.use('/desiredchanges', crudRoutes(UserDesiredHabitChanges));
app.use('/ongoingchanges', crudRoutes(UserOngoingChanges));
app.use('/weeklyroutines', crudRoutes(WeeklyRoutine));

const port = process.env.PORT || 3000;
module.exports = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
