import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import type { ReactNode } from 'react';
import './index.css';

// Eagerly load only the shell; everything else is a lazy chunk
const Home = lazy(() => import('./pages/Home'));
const Lessons = lazy(() => import('./pages/Lessons'));
const LessonDetail = lazy(() => import('./pages/LessonDetail'));
const Vocabulary = lazy(() => import('./pages/Vocabulary'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Schedule = lazy(() => import('./pages/Schedule'));
const IntensiveDrill = lazy(() => import('./pages/IntensiveDrill'));
const Techniques = lazy(() => import('./pages/Techniques'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ReadingPage = lazy(() => import('./pages/ReadingPage'));
const WritingPage = lazy(() => import('./pages/WritingPage'));
const TutorPage = lazy(() => import('./pages/TutorPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/lessons/:id" element={<LessonDetail />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
              <Route path="/drill" element={<ProtectedRoute><IntensiveDrill /></ProtectedRoute>} />
              <Route path="/techniques" element={<ProtectedRoute><Techniques /></ProtectedRoute>} />
              <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
              <Route path="/reading" element={<ProtectedRoute><ReadingPage /></ProtectedRoute>} />
              <Route path="/writing" element={<ProtectedRoute><WritingPage /></ProtectedRoute>} />
              <Route path="/tutor" element={<ProtectedRoute><TutorPage /></ProtectedRoute>} />
              <Route path="/conversation" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
