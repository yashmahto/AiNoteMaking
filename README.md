# AiNoteMaking 📝🤖

An AI-powered, voice-enabled note-taking application designed to streamline note organization through natural language and interactive conversations. Powered by Google Gemini and a secure PostgreSQL/Express backend.

---

## ✨ Features

- **🔒 Secure Authentication**: JWT-based user sign-up and sign-in with HTTP-only cookie session storage.
- **🤖 Autonomous AI Agent**: An intelligent AI assistant powered by Gemini that leverages tool-use (function calling) to manage notes directly (create, search, complete, and update notes).
- **🎤 Speech-to-Text Integration**: Capture your thoughts hands-free by speaking directly into the AI Assistant using browser-native Speech Recognition.
- **🎨 Glassmorphic Premium UI**: A highly responsive dark-themed workspace built with smooth CSS animations, dynamic hover effects, and tag-based filtering.
- **🔍 Smart Search & Filtering**: Instantly search notes by keywords or filter by completion status (*All*, *Pending*, *Completed*).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language**: TypeScript
- **Voice Transcription**: Browser-native Web Speech API
- **Styling**: Vanilla CSS with variables and modern glassmorphism UI tokens

### Backend
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: TypeScript (compiled with `tsx` development runner)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (`gemini-flash-latest`)
- **Authentication**: JWT (JSON Web Tokens), `bcrypt` password hashing, and cookie-based validation

---

## 📂 Project Structure

```text
AiNoteMaking/
├── backend/
│   ├── prisma/             # Database schema (PostgreSQL)
│   ├── src/
│   │   ├── aiAgent/        # Gemini Agent definitions & tools
│   │   ├── controllers/    # Route controllers (Auth, Notes, Agent)
│   │   ├── middleware/     # Rate limiter, Auth protection middleware
│   │   ├── routes/         # Express API routing endpoints
│   │   └── services/       # Notes business logic & DB transactions
│   └── .env                # Backend secrets & DB strings
└── frontend/
    ├── public/             # Static files
    ├── src/
    │   ├── components/     # UI Components (Dashboard, AI Chat, Modals)
    │   ├── services/       # API call handlers (Axios client setup)
    │   └── App.tsx         # Main entry component
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18+)
* [PostgreSQL](https://www.postgresql.org/) database running locally
* A [Google Gemini API Key](https://aistudio.google.com/)

---

### ⚙️ Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the `backend` folder and populate it:
   ```env
   PORT=4001
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>"
   JWT_SECRET="your_secure_jwt_key_here"
   GEMINI_API_KEY="AIzaSy..."
   ```

4. Push the schema to database and generate the Prisma Client:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:4001`.*

---

### 💻 Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite server:
   ```bash
   npm run dev
   ```
   *The client runs on `http://localhost:5173/`.*

---

## 🤖 AI Agent Commands
You can type (or dictate with the 🎤 button) natural commands into the AI assistant:
* `"Create a note called Workout Plan with content 10 pushups."`
* `"Search for notes containing 'work'"`
* `"Mark the Workout Plan note as completed"`
