(async () => {
  const path = window.location.pathname;
  let session, sessionId, questions, answers, current, timerId, timeLeft;
  const optionBtns = Array.from(document.querySelectorAll('.option-btn'));
  const nextBtn    = document.getElementById('next-btn');

  // ─── Helpers ─────────────────────────────────────────────────────────────
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

  function nextQuestion() {
    clearTimer();
    // record “no click” if none chosen
    if (!answers.find(a => a.id === questions[current].id)) {
      answers.push({ id: questions[current].id, chosen: null });
    }
    current++;
    if (current < questions.length) showQuestion();
    else submitQuiz();
  }

  function showQuestion() {
    initTimer();
    const q = questions[current];
    document.getElementById('question-text').innerText = q.question;
    optionBtns.forEach((btn, i) => {
      btn.innerText = q.options[i];
      btn.disabled = false;
      btn.onclick = () => {
        clearTimer();
        answers.push({ id: q.id, chosen: q.options[i] });
        // brief highlight could be added here...
        setTimeout(() => {
          current++;
          if (current < questions.length) showQuestion();
          else submitQuiz();
        }, 300);
      };
    });
    // Reveal Next on timeout only
    nextBtn.style.display = 'inline-block';
    nextBtn.onclick = nextQuestion;
  }

  async function submitQuiz() {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId, answers })
    });
    const result = await res.json();
    localStorage.setItem('quizResult', JSON.stringify(result));
    window.location.href = '/results.html';
  }

  // ─── Route-specific bootstrapping ────────────────────────────────────────
  if (path.endsWith('/') || path.endsWith('index.html')) {
    document.getElementById('start-btn').onclick = async () => {
      const res = await fetch('/api/start');
      session = await res.json();
      sessionId = session.sessionId;
      questions = session.questions;
      answers = [];
      current = 0;
      localStorage.setItem('quizSession', JSON.stringify(session));
      window.location.href = '/quiz.html';
    };

  } else if (path.endsWith('quiz.html')) {
    session    = JSON.parse(localStorage.getItem('quizSession') || '{}');
    sessionId  = session.sessionId;
    questions  = session.questions  || [];
    answers    = [];
    current    = 0;
    showQuestion();

  } else if (path.endsWith('results.html')) {
    const res = JSON.parse(localStorage.getItem('quizResult') || '{}');
    document.getElementById('score').innerText = `${res.score} / ${res.detailedResults.length}`;
    const list = document.getElementById('results-list');
    res.detailedResults.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'list-group-item bg-transparent border-light text-white';
      li.innerHTML = `
        <strong>${i+1}. ${r.question}</strong><br>
        You answered: ${r.userAnswer || '<em>None</em>'}<br>
        ${r.correct
          ? '<span class="text-success">Correct</span>'
          : `<span class="text-danger">Wrong</span> (Answer: ${r.correctAnswer})`}`;
      list.appendChild(li);
    });
    document.getElementById('play-again').onclick = () => {
      localStorage.clear();
      window.location.href = '/';
    };
  }
})();
document.addEventListener('DOMContentLoaded', () => {
  const audio  = document.getElementById('bg-music');
  const toggle = document.getElementById('music-toggle');

  // restore saved state (default = paused)
  const wasPlaying = localStorage.getItem('musicPlaying') === 'true';

  function updateButton() {
    toggle.textContent = audio.paused ? '🔇' : '🔊';
  }

  // if it was playing last time, start it now
  if (wasPlaying) {
    audio.play().catch(()=>{/* autoplay may be blocked until user interacts */});
  }
  updateButton();

  // toggle on button click
  toggle.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      localStorage.setItem('musicPlaying', 'true');
    } else {
      audio.pause();
      localStorage.setItem('musicPlaying', 'false');
    }
    updateButton();
  });
});
