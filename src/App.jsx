import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Contexts (Candidate-specific)
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';

// Styles
import './index.css';

// Candidate Pages & Components (Lazy Loaded)
const SystemCheck = React.lazy(() => import('./pages/candidate/SystemCheck'));
const WaitingRoom = React.lazy(() => import('./pages/candidate/WaitingRoom'));
const Interview = React.lazy(() => import('./pages/candidate/Interview'));
const Submission = React.lazy(() => import('./pages/candidate/Submission'));
const Feedback = React.lazy(() => import('./pages/candidate/Feedback'));
const SessionHandler = React.lazy(() => import('./components/auth/SessionHandler'));

// Recruiter Pages & Components (Lazy Loaded)
const Login = React.lazy(() => import('./pages/recruiter/Login'));
const Dashboard = React.lazy(() => import('./pages/recruiter/Dashboard'));
const Jobs = React.lazy(() => import('./pages/recruiter/Jobs'));
const Reports = React.lazy(() => import('./pages/recruiter/Reports'));
const ReportDetail = React.lazy(() => import('./pages/recruiter/ReportDetail'));
const Profile = React.lazy(() => import('./pages/recruiter/Profile'));
const LiveMonitoring = React.lazy(() => import('./pages/recruiter/LiveMonitoring'));
const Notifications = React.lazy(() => import('./pages/recruiter/Notifications'));

// Test Pages
const STTTest = React.lazy(() => import('./pages/STTTest'));

// Common Pages (Statically Loaded for instant 404 / layout shell loading)
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import RecruiterProtectedRoute from './components/auth/ProtectedRoute';

// Loading fallback component during lazy chunk loading
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-semibold text-gray-500">Loading page...</p>
    </div>
  </div>
);

// Candidate Context Wrapper to isolate candidate state
const CandidateWrapper = () => {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Outlet />
      </InterviewProvider>
    </AuthProvider>
  );
};

function App() {
  return (
    <Router>
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ========================================================= */}
          {/* CANDIDATE FLOW (Wrapped in Candidate Auth/Interview Contexts) */}
          {/* ========================================================= */}
          <Route element={<CandidateWrapper />}>
            {/* Session Initializer */}
            <Route path="/interview/:token" element={<SessionHandler />} />

            {/* Interview flow pages */}
            <Route path="/system-check" element={<SystemCheck />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/submission" element={<Submission />} />
            <Route path="/feedback" element={<Feedback />} />
          </Route>

          {/* ========================================================= */}
          {/* RECRUITER FLOW (Default Root / dashboard pages) */}
          {/* ========================================================= */}
          {/* Recruiter Login */}
          <Route path="/" element={<Login />} />

          {/* Protected Recruiter Pages */}
          <Route element={<RecruiterProtectedRoute />}>
            {/* Full-screen protected routes */}
            <Route path="/live-monitoring/:sessionId" element={<LiveMonitoring />} />
            {/* Redirect /recruiter/interviews/:sessionId/track links to Live Monitoring */}
            <Route path="/recruiter/interviews/:sessionId/track" element={<LiveMonitoring />} />

            {/* Main dashboard layout routes */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report/:id" element={<ReportDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* ========================================================= */}
          {/* GLOBAL 404 ROUTE */}
          {/* ========================================================= */}
          <Route path="/test-stt" element={<STTTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
