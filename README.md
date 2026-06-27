# 📚 AI Study Buddy

An AI-powered learning assistant designed to make studying more interactive, personalized, and efficient. AI Study Buddy combines conversational tutoring, intelligent document summarization, active recall flashcards, and adaptive quizzes into a unified learning workspace powered by Google's Gemini models.

> 🚀 Built using React, TypeScript, Vite, Node.js, Express, Google AI Studio (Gemini API), and Google Cloud Run.

---

## ✨ Features

- 💬 AI Study Chat
  - Ask questions and receive personalized explanations.
  - Learn concepts through simplified explanations and real-world analogies.

- 📄 Intelligent Document Summarizer
  - Upload study materials.
  - Generate structured summaries for faster revision.

- 🧠 Flashcard Generator
  - Automatically creates AI-powered question-answer flashcards.
  - Supports active recall learning.

- 📝 Adaptive Quiz Generator
  - Generates topic-specific multiple-choice quizzes.
  - Instant scoring and performance feedback.

- 📊 Study Dashboard
  - Track study objectives and achievements.
  - Interactive scratchpad for quick notes.
  - Gamified learning experience.

- ⚡ High Availability AI
  - Multi-model Gemini fallback architecture ensures uninterrupted learning even during API rate limits or temporary service outages.

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript (TSX)
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript

### AI Platform
- Google AI Studio
- Gemini API

### Deployment
- Google Cloud Run

### Version Control
- Git & GitHub

---

## 🏗 System Architecture

User Input
↓
React + TypeScript Frontend
↓
Express API Server
↓
Google Gemini API
↓
AI Response
↓
Interactive Learning Workspace

---

## ⚙ High Availability Architecture

To ensure uninterrupted learning sessions, the application employs a cascading multi-model fallback mechanism.

```
Primary
Gemini 3.5 Flash
        │
        ▼
Gemini 2.5 Flash
        │
        ▼
Gemini 3.1 Flash Lite
        │
        ▼
Gemini Flash Latest
```

If one model becomes temporarily unavailable or reaches rate limits, requests are automatically redirected to the next available model.

---

## 🚀 Live Demo

https://ai-study-buddy-211335048403.asia-southeast1.run.app

---

## 🎯 Use Cases

- Students preparing for examinations
- Quick revision of lecture notes
- Self-paced learning
- AI-assisted concept clarification
- Active recall practice
- Daily study planning

---

## 🔮 Future Improvements

- Voice-based AI tutor
- OCR support for handwritten notes
- Retrieval-Augmented Generation (RAG)
- Multiplayer collaborative study rooms
- Learning analytics
- Mobile application
- Multi-language support

---

## 📚 References

- Google AI Studio
- Gemini API
- React
- TypeScript
- Vite
- Tailwind CSS
- Node.js
- Express.js
- Google Cloud Run

---

## 👩‍💻 Developer

Developed by **Sajina**

