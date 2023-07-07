const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI)

const UserSchema = new Schema ({ username: String });
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  try {
    const uObj = new User({ username: req.body.username });
    const user = await uObj.save();
    res.json(user);
  } catch(err) {
    console.log(err);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if(!user) {
      res.json({error: "user not found"});
    }
    const eObj = new Exercise({
      user_id: user._id,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date
    });
    const exercise = await eObj.save();
    res.json({
      _id: user._id,
      username: user.username,
      date: new Date(exercise.date).toDateString(),
      duration: exercise.duration,
      description: exercise.description
    });
  } catch(err) {
    console.log(err);
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch(err) {
    console.log(err);
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id);
  if(!user) {
    res.json({error: "user not found"});
  }
  const { from, to, limit } = req.query;
  let dateObj = {}
  if(from) {
    dateObj["$gte"] = new Date(from);
  } 
  if(to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: req.params._id
  }
  if(from || to) {
    filter.date = dateObj
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  const log = exercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  })) 
  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
