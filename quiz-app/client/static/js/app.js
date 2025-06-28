// client/static/js/app.js

// ─── Helpers ───────────────────────────────────────────────────────────────
function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Fetch questions from backend ──────────────────────────────────────────
async function fetchQuestions(amount, category) {
  const params = new URLSearchParams({ amount });
  if (category) params.append('category', category);
  const res = await fetch(`/api/questions?${params.toString()}`);
  const data = await res.json();
  if (data.response_code !== 0) {
    throw new Error('Trivia API error: ' + data.response_code);
  }
  return data.results.map((q, i) => ({
    id:       i,
    question: q.question,
    options:  shuffle(q.options),
    correctAnswer: q.options.find(opt => opt === decodeHTML(q.correct_answer)) // session stores correct_answer
  }));
}

// ─── Quiz logic ─────────────────────────────────────────────────────────────
let questions = [], answers = [], current = 0;
let timerId, timeLeft, startTime;

function initTimer() {
  timeLeft = 30;
  document.getElementById('timer').innerText = `Time: ${timeLeft}s`;
  timerId = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').innerText = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) nextQuestion();
  }, 1000);
}

function clearTimer() {
  clearInterval(timerId);
}

function showQuestion() {
  if (current === 0) startTime = Date.now();
  initTimer();

  const q = questions[current];
  document.getElementById('question-text').innerText = q.question;
  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach((btn, i) => {
    btn.innerText  = q.options[i];
    btn.disabled   = false;
    btn.onclick    = () => {
      clearTimer();
      answers.push({ id: q.id, chosen: q.options[i] });
      setTimeout(() => {
        current++;
        if (current < questions.length) showQuestion();
        else submitQuiz();
      }, 300);
    };
  });

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'inline-block';
  nextBtn.onclick       = nextQuestion;
}

function nextQuestion() {
  clearTimer();
  const q = questions[current];
  if (!answers.find(a => a.id === q.id)) {
    answers.push({ id: q.id, chosen: null });
  }
  current++;
  if (current < questions.length) showQuestion();
  else submitQuiz();
}

async function submitQuiz() {
  clearTimer();
  const duration = Date.now() - startTime;
  const payload = { answers, duration, category: window.quizConfig.category };
  const res = await fetch('/api/submit', {
    method:  'POST',
    headers: {'Content-Type':'application/json'},
    body:    JSON.stringify(payload)
  });
  const result = await res.json();
  localStorage.setItem('quizResult', JSON.stringify(result));
  window.location.href = '/results';
}

// ─── DOMContentLoaded ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1) VANTA background
  if (window.VANTA) {
    VANTA.HALO({
      el: '.vanta-bg',
      mouseControls: true,
      touchControls: true,
      gyroControls: false
    });
  }

  // 2) Music toggle
  const audio  = document.getElementById('bg-music');
  const toggle = document.getElementById('music-toggle');
  const wasPlaying = localStorage.getItem('musicPlaying') === 'true';

  function updateMusicButton() {
    toggle.textContent = audio.paused ? '🔇' : '🔊';
  }

  if (wasPlaying) audio.play().catch(() => {});
  updateMusicButton();
  toggle.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      localStorage.setItem('musicPlaying', 'true');
    } else {
      audio.pause();
      localStorage.setItem('musicPlaying', 'false');
    }
    updateMusicButton();
  });

  // 3) Route handling
  const path = window.location.pathname;

  // ─── Welcome page ────────────────────────────────────────────────────────
  if (path === '/') {
    // Populate categories
    try {
      const res = await fetch('/api/categories');
      const cats = await res.json();
      const selectCat = document.getElementById('category');
      cats.forEach(({ id, name }) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.text  = name;
        selectCat.appendChild(opt);
      });
    } catch (e) {
      console.error('Failed to load categories', e);
    }

    // Wire start button
    document.getElementById('start-btn').addEventListener('click', () => {
      const amount     = document.getElementById('amount').value;
      const categoryId = document.getElementById('category').value;
      const qs = new URLSearchParams({ amount });
      if (categoryId) qs.append('category', categoryId);
      window.location.href = `/quiz?${qs.toString()}`;
    });
  }

  // ─── Quiz page ───────────────────────────────────────────────────────────
  else if (path.startsWith('/quiz')) {
    // Read config
    window.quizConfig = {
      amount:   document.getElementById('quiz-container').dataset.amount,
      category: document.getElementById('quiz-container').dataset.category
    };
    try {
      questions = await fetchQuestions(window.quizConfig.amount, window.quizConfig.category);
      answers   = [];
      current   = 0;
      showQuestion();
    } catch (e) {
      console.error('Quiz load failed', e);
      alert('Failed to load questions. Please try again.');
    }
  }

  // ─── Results page ────────────────────────────────────────────────────────
  else if (path.startsWith('/results')) {
    const res = JSON.parse(localStorage.getItem('quizResult') || '{}');
    document.getElementById('score').innerText =
      `${res.score} / ${res.detailedResults.length}`;

    const list = document.getElementById('results-list');
    res.detailedResults.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'list-group-item bg-transparent border-light text-white';
      li.innerHTML = `
        <strong>${i+1}. ${r.question}</strong><br>
        You answered: ${r.userAnswer ?? '<em>None</em>'}<br>
        ${r.correct
          ? '<span class="text-success">Correct</span>'
          : `<span class="text-danger">Wrong</span> (Answer: ${r.correctAnswer})`
        }`;
      list.appendChild(li);
    });

    document.getElementById('play-again').addEventListener('click', () => {
      localStorage.removeItem('quizResult');
      window.location.href = '/';
    });
  }
});
