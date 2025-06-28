// server/index.js

require('dotenv').config();

const express   = require('express');
const path      = require('path');
const axios     = require('axios');
const session   = require('express-session');
const crypto    = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const app  = express();
const PORT = process.env.PORT || 8080;

(async () => {
  // ─── Connect to MongoDB ─────────────────────────────────────────────────
  const client = new MongoClient(process.env.ATLAS_URI, {
    useNewUrlParser:  true,
    useUnifiedTopology: true
  });
  await client.connect();
  const db        = client.db();
  const usersCol  = db.collection('users');
  const scoresCol = db.collection('scores');

  // ─── App & Middleware ──────────────────────────────────────────────────
  app.set('views', path.join(__dirname, '../client'));
  app.set('view engine', 'ejs');

  app.use(express.static(path.join(__dirname, '../client')));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false
  }));

  // ─── Auth Guard ────────────────────────────────────────────────────────
  function ensureLoggedIn(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/signin');
  }

  // ─── SIGNUP / SIGNIN Routes ────────────────────────────────────────────
  app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
  });

  app.post('/signup/submit', async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.render('signup', { error: 'All fields are required.' });
      }
      if (await usersCol.findOne({ email })) {
        return res.render('signup', { error: 'Email already in use.' });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      await usersCol.insertOne({
        name,
        email,
        salt,
        hash,
        createdAt: new Date()
      });
      res.redirect('/signin');
    } catch (err) {
      next(err);
    }
  });

  app.get('/signin', (req, res) => {
    res.render('signin', { error: null });
  });

  app.post('/signin/submit', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.render('signin', { error: 'Both fields are required.' });
      }
      const user = await usersCol.findOne({ email });
      if (!user) {
        return res.render('signin', { error: 'Invalid credentials.' });
      }
      const hashAttempt = crypto
        .scryptSync(password, user.salt, 64)
        .toString('hex');
      if (hashAttempt !== user.hash) {
        return res.render('signin', { error: 'Invalid credentials.' });
      }
      req.session.userId   = user._id.toString();
      req.session.userName = user.name;
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/signin'));
  });

  // ─── VIEW ROUTES ───────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    if (req.session.userId) {
      // Logged-in users go to their dashboard
      return res.render('welcome', { user: { username: req.session.userName } });
    } else {
      // New visitors see the home landing page
      return res.render('home');
    }
  });

  app.get('/quiz', ensureLoggedIn, (req, res) => {
    const { amount = 10, category = '' } = req.query;
    res.render('quiz', {
      user:     { username: req.session.userName },
      amount,
      category
    });
  });

  app.get('/results', ensureLoggedIn, (req, res) => {
    res.render('results', { user: { username: req.session.userName } });
  });

  app.get('/profile', ensureLoggedIn, async (req, res, next) => {
    try {
      const uid    = new ObjectId(req.session.userId);
      const scores = await scoresCol.find({ userId: uid }).sort({ date: -1 }).toArray();
      res.render('profile', {
        user:   { username: req.session.userName },
        scores
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/leaderboard', ensureLoggedIn, async (req, res, next) => {
    try {
      const top = await scoresCol.find()
        .sort({ score: -1, date: 1 })
        .limit(10)
        .toArray();
      res.render('leaderboard', {
        user: { username: req.session.userName },
        top
      });
    } catch (err) {
      next(err);
    }
  });

  // ─── TRIVIA API PROXY ──────────────────────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  app.get('/api/categories', ensureLoggedIn, async (req, res, next) => {
    try {
      const { data } = await axios.get('https://opentdb.com/api_category.php');
      res.json(data.trivia_categories);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/questions', ensureLoggedIn, async (req, res, next) => {
    try {
      const { amount = 10, category = '' } = req.query;
      const params = new URLSearchParams({ amount });
      if (category) params.append('category', category);
      const url = `https://opentdb.com/api.php?${params.toString()}`;
      const { data } = await axios.get(url);
      if (data.response_code !== 0) {
        return res.status(500).json({ error: 'Trivia API error', code: data.response_code });
      }
      const qlist = data.results.map((q, i) => ({
        id:            i,
        question:      q.question,
        correctAnswer: q.correct_answer,
        options:       shuffle([ ...q.incorrect_answers, q.correct_answer ])
      }));
      req.session.questions = qlist;
      const publicQs = qlist.map(({ id, question, options }) => ({ id, question, options }));
      res.json({ response_code: 0, results: publicQs });
    } catch (err) {
      next(err);
    }
  });

  // ─── SUBMIT & GRADE ─────────────────────────────────────────────────────
  app.post('/api/submit', ensureLoggedIn, async (req, res, next) => {
    try {
      const { answers, duration, category } = req.body;
      const qlist = req.session.questions || [];
      let score = 0;
      const detailedResults = qlist.map(q => {
        const ansObj    = answers.find(a => a.id === q.id);
        const userAnswer = ansObj ? ansObj.chosen : null;
        const correct    = userAnswer === q.correctAnswer;
        if (correct) score++;
        return {
          question:      q.question,
          userAnswer,
          correctAnswer: q.correctAnswer,
          correct
        };
      });
      await scoresCol.insertOne({
        userId:   new ObjectId(req.session.userId),
        userName: req.session.userName,
        category,
        score,
        duration,
        date:     new Date()
      });
      delete req.session.questions;
      res.json({ score, detailedResults });
    } catch (err) {
      next(err);
    }
  });

  // ─── ERROR HANDLER & LAUNCH ────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal server error');
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
})();
