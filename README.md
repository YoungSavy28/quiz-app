# 🎯 Project 3: Quiz App

## 🧠 Description

In this project, our team created a **quiz application** using a **client-server architecture** and integrated APIs. This builds on the foundation from Project 2 and extends it with full-stack capabilities. The application consists of several key features and pages that enhance the user experience and provide persistent data storage via **MongoDB Atlas**.

---

## 📄 Core Pages

1. **Home Page** – A landing page where users can start the quiz or join the platform.
2. **Quiz Page** – Displays 10 trivia questions using the Trivia API.
3. **Results Page** – Shows the user’s score and question breakdown after completing a quiz.

---

## 🔐 Authentication Features

- **Signup/Login Page** – Allows users to create accounts and log in securely.
- **MongoDB Storage** – User data and quiz history are saved to a cloud database.
- **User Profile Page** – Displays a user’s past performance and quiz history.
- **Leaderboard Page** – Displays the top 10 users based on quiz scores.

---

## 📦 API Integration

Trivia questions are retrieved in real-time from the [Open Trivia API](https://opentdb.com/api_config.php), which allows category selection and custom question count.

---

## ✨ Extra Features

- ⏳ **Quiz Timer** – Timer per question or quiz.
- 📤 **Share Score** – Users can share their results on social media.
- 🎵 **Background Music** – Playable sound during the quiz experience.
- 🎨 **Animated Landing Page** – Engaging introduction to the app.
- 📱 **Mobile-Friendly** – Responsive UI using Bootstrap.

---

## 🧪 Tools & Technologies

- Node.js / Express.js
- EJS (Embedded JavaScript Templating)
- MongoDB Atlas
- Bootstrap 5 / CSS
- JavaScript
- dotenv (for environment variables)
- Render (for deployment)

---

## 🚀 How to Run the App Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/YoungSavy28/quiz-app.git
   cd quiz-app/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your `.env` file in the `server/` folder:
   ```
   ATLAS_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/test
   SESSION_SECRET=<your-session-secret>
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Visit `http://localhost:8080` or `3000` depending on your configuration.

---

## 🛰️ Deployment

Deployed using **Render**.

- 🌐 **GitHub Repo**: [https://github.com/YoungSavy28/quiz-app](https://github.com/YoungSavy28/quiz-app)
- 🚀 **Live Site**: [https://quiz-app-zj5b.onrender.com](https://quiz-app-zj5b.onrender.com)

---

## 👥 Team

- **Xavier Cabrera** – Full-stack developer, auth logic, leaderboard, deployment.

---

## ✅ Instructor Requirements (Fulfilled)

✔️ Home, Quiz, Results pages  
✔️ Signup/Login w/ salted+hashed passwords  
✔️ MongoDB integration for user data + quiz history  
✔️ User profile page  
✔️ Leaderboard with top-10 scores  
✔️ Trivia API integration  
✔️ Deployment to Render  
✔️ Timer & share feature (extra credit)  
✔️ README with features, roles, and run instructions

---


