# Atlas Premium Platform

AI-powered educational platform with advanced learning features.

## Features

- **Doubt Solver** - RAG-based and general AI chat for educational queries. Includes a "Syllabus RAG" mode for document-specific tutoring.
- **College Compass** - AI college counselor with Google Search grounding and verified citations.
- **Quiz & Assessment** - AI-generated quizzes from syllabus context with automated grading and remedial recommendations.
- **Document Study** - Advanced document analysis with hierarchical RAG for large PDFs and images.

## Setup

1. Install dependencies:
```bash
npm install
cd server && npm install && cd ..
```

2. Create a `.env` file in the root and `server/` directory with your API keys:
```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
MONGODB_URI=your_mongodb_uri (optional, defaults to local)
```

3. Run the application:
```bash
# In Command Prompt (cmd)
start_app.bat

# In PowerShell
.\start_app.bat
```
This will start both the backend (5001) and frontend (8080).

## Tech Stack

- **Frontend**: React 18+ with Vite
- **Backend**: Express.js with Node-Fetch
- **AI**: Google Gemini 1.5 Flash (Grounding) & Groq Llama 3 (Doubt/Quiz)
- **Styling**: Vanilla CSS with Glassmorphism
- **Database**: MongoDB (User Auth)

## Project Structure

```
Atlas/
├── src/
│   ├── components/       # UI Components
│   ├── utils/            # RagService, CloudService, API Utils
│   ├── contexts/         # ThemeContext
│   └── App.jsx           # Main Entry
├── server/               # Express Backend
│   ├── routes/           # AI and Auth routes
│   └── models/           # Mongoose Models
├── start_app.bat         # Automation Script
└── package.json
```

## Development

The frontend runs on http://localhost:8080. API calls are proxies to http://localhost:5001 via Vite.
