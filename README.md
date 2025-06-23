# Quiz App

A dynamic, Express-backed quiz application with a VANTA.js background and Bootstrap-powered responsive UI. Users can test their MLB knowledge with randomized questions, a per-question timer, and session-based scoring.

## Features

- **Three main pages**  
  - **Home:** “Welcome to the Quiz” landing page with subtitle and Start button  
  - **Quiz:** One question at a time, 30 s timer, four answer buttons, auto-advance on selection or timeout  
  - **Results:** Shows your score out of 10 and a detailed list of correct/incorrect answers  
- **Server-side question selection**  
  - Loads from `questions.json`  
  - Shuffles and picks 10 questions per session  
  - Tracks sessions so repeat plays get a fresh random set  
- **Client-server architecture**  
  - **Express** serves static HTML/CSS/JS and provides `/api/start` & `/api/submit` endpoints  
  - **Client JS** handles quiz flow, timer, localStorage for session/result persistence  
- **Extras implemented**  
  - 30 s countdown timer per question  
  - “Play Again” functionality to restart a new session  
- **Styling & UX**  
  - **VANTA.HALO** animated background on all pages, i found this on google. I thought a regular website wouldve been boring so i searched up 3d website
  - **Bootstrap 5** responsive grid, cards, and button groups  
  - Clean, centered layouts on desktop & mobile  

## Installation & Running

1. **Clone the repo**  
   ```bash
   https://github.com/YoungSavy28/quiz-app
   cd quiz-app/server
