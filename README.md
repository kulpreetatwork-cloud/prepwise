# Prepwise - AI-Powered Mock Interview Platform

Prepwise is a real-time AI voice-powered mock interview platform designed for college students and freshers who want personalized interview preparation to land their dream job. It features a Zoom-like AI interviewer that speaks, listens, and adapts in real-time, delivering detailed post-interview feedback with actionable insights.

## Core Features

### Real-Time AI Voice Interview
- Turn-based, Zoom-like interview setup powered by **Groq AI** for intelligent question generation and conversation flow
- Browser-native **Speech Recognition** (STT) and **Speech Synthesis** (TTS) for zero-cost, seamless voice interaction
- AI interviewer greets naturally, adapts follow-up questions based on responses, and ends professionally
- Real-time Socket.IO communication between client and server
- Live transcript panel with speaker-attributed messages

### Comprehensive Interview Customization
- **10+ target roles**: Frontend, Backend, Full Stack, Data Analyst, DevOps, Product Manager, and more
- **Interview types**: Technical, Behavioral, HR, System Design, Mixed
- **Difficulty levels**: Easy, Medium, Hard, Expert
- **Duration options**: 5, 10, 15, or 20 minutes with natural time-aware ending
- **Interview style**: Friendly, Neutral, Challenging
- **Company style**: FAANG, Startup, Corporate, General
- **Practice vs. Assessment** modes
- **Focus areas**, resume text, and job description inputs for personalized questions
- All customizations dynamically influence Groq's question generation

### Detailed AI Feedback
- Overall score (0-100) with letter grade
- Category breakdown: Communication, Technical Accuracy, Confidence, Clarity, Relevance
- Radar chart and bar chart visualizations
- Strengths and areas for improvement
- Question-by-question analysis with ideal answers
- PDF download of feedback report

### Community Forum
- Create, edit, and delete posts with categories and tags
- Upvote/downvote system for posts and comments
- Threaded comment replies
- Category filtering, search, and sort (Recent, Most Voted, Popular)
- User attribution with target role display

### Leaderboard
- Rankings by: Top Scores, Most Interviews, Longest Streaks, Most Improved
- Time period filters: Weekly, Monthly, All Time
- Top-3 podium with visual ranking display
- Personal rank callout

### Advanced Analytics
- GitHub-style contribution heatmap (365-day interview activity)
- Score trend and category performance charts over time
- Performance breakdowns by interview type, difficulty, role, and duration
- Best time-of-day analysis
- Summary stats: total interviews, practice hours, best score, improvement rate

### Interview Templates
- Save and reuse custom interview configurations
- Pre-seeded default templates (Quick Behavioral Warmup, FAANG Technical Deep Dive, etc.)
- One-click template loading with usage tracking

### Additional Features
- **Dashboard** with stats, progress charts, skill radar, achievements, and recent interviews
- **Question Bank** with curated questions, ideal answers, tips, and bookmarking
- **Guided Onboarding Tour** for new users
- **Dark-first UI** with gradient accents and glassmorphism design
- **Fully responsive** across desktop, tablet, and mobile
- **Code splitting** with lazy-loaded routes for fast initial load

## Tech Stack

### Frontend
- **React 19** (Vite) with lazy loading and Suspense
- **Tailwind CSS v4** for utility-first styling
- **Framer Motion** for animations and transitions
- **Zustand** for lightweight state management
- **Socket.IO Client** for real-time communication
- **Recharts** for data visualization
- **jsPDF** for PDF report generation
- **React Router v7** for client-side routing

### Backend
- **Node.js** with **Express 5**
- **MongoDB** (Mongoose ODM) with MongoDB Atlas
- **Socket.IO** for bidirectional real-time events
- **JWT** authentication with **Passport.js**
- **Groq SDK** for LLM-powered interview logic and feedback generation
- **bcryptjs** for password hashing
- **Morgan** for HTTP request logging

### Authentication
- Email/Password with JWT tokens
- Google OAuth 2.0 via `@react-oauth/google`

## Project Structure

```
Platform_Prepwise/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AIOrb.jsx       # AI avatar animation
│   │   │   ├── Layout.jsx      # Main layout with sidebar
│   │   │   └── OnboardingTour.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAudio.js     # Microphone testing
│   │   │   └── useSpeechRecognition.js
│   │   ├── pages/              # Route pages
│   │   │   ├── Analytics.jsx
│   │   │   ├── Community.jsx
│   │   │   ├── CommunityPost.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Feedback.jsx
│   │   │   ├── History.jsx
│   │   │   ├── InterviewRoom.jsx
│   │   │   ├── InterviewSetup.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── QuestionBank.jsx
│   │   │   └── Register.jsx
│   │   ├── services/           # API client (Axios)
│   │   ├── store/              # Zustand stores
│   │   ├── utils/              # Constants, helpers, tour steps
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind + custom styles
│   └── package.json
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # Database connection
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth & error handling
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Interview.js
│   │   │   ├── Feedback.js
│   │   │   ├── Question.js
│   │   │   ├── Achievement.js
│   │   │   ├── Post.js
│   │   │   ├── Comment.js
│   │   │   └── Template.js
│   │   ├── routes/            # API route definitions
│   │   ├── seeds/             # Database seeders
│   │   ├── services/          # Groq AI service
│   │   └── sockets/           # Socket.IO interview handler
│   ├── index.js               # Server entry point
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB Atlas** account ([free tier](https://www.mongodb.com/atlas))
- **Groq API key** ([free at console.groq.com](https://console.groq.com))
- **(Optional)** Google Cloud Console project with OAuth 2.0 credentials

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/<your-username>/Platform_Prepwise.git
cd Platform_Prepwise
```

2. **Install dependencies**

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Configure environment variables**

```bash
# Backend
cp server/.env.example server/.env

# Frontend
cp client/.env.example client/.env
```

Edit both `.env` files with your actual credentials (see Environment Variables below).

4. **Seed the database**

```bash
cd server
npm run seed          # Seeds question bank
node src/seeds/seedTemplates.js  # Seeds default interview templates
```

5. **Start development servers**

```bash
# Terminal 1 - Backend (runs on port 5000)
cd server
npm run dev

# Terminal 2 - Frontend (runs on port 5173)
cd client
npm run dev
```

6. Open **http://localhost:5173** in your browser (Chrome recommended for best STT/TTS support)

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for signing JWT tokens | Yes |
| `JWT_EXPIRE` | Token expiration (e.g., `7d`) | No (default: 7d) |
| `GROQ_API_KEY` | Groq API key for AI features | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `CLIENT_URL` | Frontend URL for CORS | No (default: http://localhost:5173) |

### Client (`client/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |
| `VITE_SOCKET_URL` | Backend Socket.IO URL | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | No |

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Set the root directory to `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables in Vercel dashboard

### Backend (Render)
1. Create a new Web Service on [Render](https://render.com)
2. Set the root directory to `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render dashboard

## Browser Compatibility

- **Chrome/Edge** (recommended): Full support for Speech Recognition and Speech Synthesis
- **Firefox**: Speech Synthesis supported; Speech Recognition requires enabling `media.webspeech.recognition.enable` flag
- **Safari**: Partial Speech Recognition support

## License

MIT
