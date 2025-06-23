// server/index.js
const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');

// Load all questions once
let allQuestions = [];
try {
  allQuestions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
} catch (err) {
  console.error('Failed to load questions.json:', err);
  process.exit(1);
}

// Fisher–Yates shuffle in place
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Pick 10 random questions each time
function pickQuestions() {
  const copy = allQuestions.slice();
  shuffle(copy);
  return copy.slice(0, 10);
}

// In-memory session store
const sessions = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Start a new quiz session
app.get('/api/start', (req, res) => {
  const sessionId = uuidv4();
  const chosenQs = pickQuestions();
  sessions.set(sessionId, chosenQs);

  // Strip out the correctAnswer before sending
  const publicQs = chosenQs.map(({ id, question, options }) => ({
    id, question, options
  }));

  res.json({ sessionId, questions: publicQs });
});

// Submit answers & grade
app.post('/api/submit', (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  const chosenQs = sessions.get(sessionId);
  let score = 0;
  const detailedResults = chosenQs.map(q => {
    const userAnsObj = answers.find(a => a.id === q.id);
    const userAnswer = userAnsObj ? userAnsObj.chosen : null;
    const correct = userAnswer === q.correctAnswer;
    if (correct) score++;
    return {
      id: q.id,
      question: q.question,
      userAnswer,
      correctAnswer: q.correctAnswer,
      correct
    };
  });

  // Clean up session
  sessions.delete(sessionId);
  res.json({ score, detailedResults });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Quiz server running on http://localhost:${PORT}`);
});
