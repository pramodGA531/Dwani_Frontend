# DwaniAI Frontend

Welcome to the DwaniAI Frontend repository! This application is built with React and serves as the primary interface for both Candidates taking AI-driven interviews and Recruiters managing the recruitment process.

## 🚀 Tech Stack
- **Framework**: React (with Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Routing**: React Router DOM

---

## 📂 Project Structure

We've organized the codebase logically to separate concerns and user flows.

```text
frontend/src/
├── api/                  # Pure JS functions for fetching data (Axios API SDK)
├── assets/               # Static assets (images, icons)
├── components/           # Reusable UI components
│   ├── auth/             # Authentication & session guards (e.g., SessionHandler)
│   ├── interviews/       # Specialized interview UI (e.g., VoiceInit)
│   ├── layout/           # Global layout wrappers (Header, Sidebar, Navigation)
│   └── ui/               # Generic shared UI elements
├── context/              # Global React Contexts (InterviewContext, AuthContext)
├── hooks/                # Custom React Hooks (useVoiceStream, useResults)
├── lib/                  # Utility and helper functions
└── pages/                # Application Routes
    ├── candidate/        # The Candidate Interview Flow
    └── recruiter/        # The Recruiter Dashboard Flow
```

---

## 🌊 User Flows

The application is strictly divided into two distinct flows:

### 1. The Candidate Flow (Interview Experience)
This flow is accessed via an invitation link. It is designed to be frictionless, heavily guided, and highly interactive.
1. **System Check (`SystemCheck.jsx`)**: Verifies microphone and camera permissions before starting.
2. **Waiting Room (`WaitingRoom.jsx`)**: A brief holding area while the AI Engine prepares the interview environment.
3. **Active Interview (`Interview.jsx`)**: The core AI interview interface, featuring real-time speech-to-text, voice visualizers, and dynamic question generation.
4. **Submission (`Submission.jsx`)**: Processing screen while the final answers are evaluated.
5. **Feedback (`Feedback.jsx`)**: Final screen thanking the candidate and providing next steps.

### 2. The Recruiter Flow (Platform Management)
This flow is secured behind authentication and is used by HR and Recruiters to manage the entire pipeline.
1. **Login (`Login.jsx`)**: Secure authentication for recruiters.
2. **Dashboard (`Dashboard.jsx`)**: High-level overview of interview statistics and recent activities.
3. **Jobs (`Jobs.jsx`)**: Management of active job postings and required skills for the AI.
4. **Live Monitoring (`LiveMonitoring.jsx`)**: Real-time observability into ongoing candidate interviews, including anomaly detection.
5. **Reports & Details (`Reports.jsx`, `ReportDetail.jsx`)**: Detailed analytics, transcripts, and AI-evaluated scores for completed interviews.
6. **Profile & Settings (`Profile.jsx`, `Settings.jsx`)**: Recruiter account management.

---

## 🛠️ Development

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Mocking Data
If the backend is unavailable during local development, the application has built-in fallbacks. The `api/mockData.js` file provides placeholder data (like `MOCK_INTERVIEW_QUESTIONS` and `MOCK_DASHBOARD_DATA`) to ensure the UI can still be tested and designed without a live session token.

---

## 🔒 Security & Architecture Notes
- **API Layer**: All backend interactions are abstracted into the `api/` folder. React components should never call `axios` directly; they should use the API SDK functions or custom hooks.
- **Session Handling**: Candidate sessions are validated in `components/auth/SessionHandler.jsx` using one-time tokens to prevent unauthorized access.
